import "server-only";
import { createHash } from "node:crypto";
import { dictionarySpans } from "./names";
import { PLACEHOLDER_RULES, Vault, protect, restoreDeep, type PrivacyHints, type Span } from "./pseudonymise";

// The app's side of the privacy service (privacy/server.mjs, on our own server). Every AI call
// passes its prompt through `protectPrompt` first. If the service is configured and can't be
// reached, the call stops: nothing is sent to an AI company with names in it.

export class PrivacyUnavailableError extends Error {
  constructor() {
    super("The private name check isn't available.");
    this.name = "PrivacyUnavailableError";
  }
}

const TIMEOUT_MS = 15_000;
const BATCH = 48;

/** Spans already found, by a hash of the line (never the text itself). */
const cache = new Map<string, Span[]>();
const CACHE_LIMIT = 4000;
let warned = false;

const hash = (text: string) => createHash("sha256").update(text).digest("base64url");

async function post<T>(path: string, body: unknown): Promise<T> {
  const base = process.env.PRIVACY_URL;
  if (!base) throw new Error("PRIVACY_URL is not set");
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`privacy service ${response.status}`);
    return (await response.json()) as T;
  } catch (err) {
    console.error("privacy service unavailable:", err instanceof Error ? err.message : err);
    throw new PrivacyUnavailableError();
  }
}

export function privacyServiceConfigured(): boolean {
  return Boolean(process.env.PRIVACY_URL);
}

/**
 * People's names in each line, from our own model. Lines are cached by hash, so the wins and
 * settings repeated across a draft's several AI calls are read once. Without PRIVACY_URL (local
 * development, tests) only the name lists and known names are used.
 */
async function modelSpans(lines: string[]): Promise<Span[][]> {
  if (!privacyServiceConfigured()) {
    if (!warned && process.env.NODE_ENV === "production") console.warn("PRIVACY_URL is not set: names are found by lists only.");
    warned = true;
    return lines.map(() => []);
  }
  const keys = lines.map(hash);
  const missing = [...new Set(lines.filter((line, i) => line.trim() && !cache.has(keys[i])))];
  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH);
    const { spans } = await post<{ spans: Span[][] }>("/ner", { texts: batch });
    batch.forEach((line, j) => {
      if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
      cache.set(hash(line), spans[j] ?? []);
    });
  }
  return lines.map((line, i) => (line.trim() ? (cache.get(keys[i]) ?? []) : []));
}

/** All the names found in a text: our model, then the name lists, as spans of the whole text. */
export async function detectPeople(text: string): Promise<Span[]> {
  const lines = text.split("\n");
  const perLine = await modelSpans(lines);
  const spans: Span[] = [];
  let offset = 0;
  lines.forEach((line, i) => {
    for (const [s, e] of perLine[i]) spans.push([offset + s, offset + e]);
    for (const [s, e] of dictionarySpans(line)) spans.push([offset + s, offset + e]);
    offset += line.length + 1;
  });
  return spans;
}

export interface Protected {
  prompt: string;
  /** The system prompt with the placeholder rules added. */
  system: string;
  /** Puts names back into the model's parsed answer. */
  reveal: <T>(value: T) => T;
}

/** Replaces names and private terms in a prompt before it goes to the AI model. */
export async function protectPrompt(system: string, prompt: string, hints: PrivacyHints = {}): Promise<Protected> {
  const vault = new Vault();
  const masked = protect(prompt, await detectPeople(prompt), hints, vault);
  return {
    prompt: masked,
    system: `${system}\n\n${PLACEHOLDER_RULES}`,
    reveal: (value) => restoreDeep(value, vault, hints.restorePeople ?? true),
  };
}

/** Embeddings from our own model, for searching the record. Null when the service isn't set up. */
export async function embed(texts: string[], kind: "query" | "passage"): Promise<{ model: string; vectors: number[][] } | null> {
  if (!privacyServiceConfigured() || !texts.length) return null;
  const vectors: number[][] = [];
  let model = "";
  for (let i = 0; i < texts.length; i += BATCH) {
    const result = await post<{ model: string; vectors: number[][] }>("/embed", { texts: texts.slice(i, i + BATCH), kind });
    model = result.model;
    vectors.push(...result.vectors);
  }
  return { model, vectors };
}
