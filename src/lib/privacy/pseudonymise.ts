// Swapping people's names and confidential terms for placeholders before text goes to an AI
// model, and putting them back in what comes out. Pure functions; the name finding itself is in
// detect.ts (our own model) and names.ts (name lists).
//
//   "Priya Raman fixed the Falcon bug; Priya thanked the team."
//   → "[Person 1] fixed the [Private 1] bug; [Person 1] thanked the team."
//
// People get the same placeholder every time they appear, including by first name alone, so the
// model can still follow who did what. Confidential terms (the never-mention list, and the
// employer when the rule says not to name it) are never put back: what the model writes about
// them reads "[private]", and the checks stop it reaching a post.

export type Span = [number, number];

export interface PrivacyHints {
  /** Names we already know: the user's own, and the people in their network. */
  knownPeople?: string[];
  /** Terms that must never reach the model or a post. */
  privateTerms?: string[];
  /** Put people's names back in the output (default). Off when names must stay out of the record. */
  restorePeople?: boolean;
}

/** The placeholders used in one AI call, and what each stands for. */
export class Vault {
  private people = new Map<string, string>();
  private terms = new Map<string, string>();
  private count = 0;
  readonly originals = new Map<string, string>();

  person(name: string): string {
    const key = normaliseName(name);
    let tag = this.people.get(key);
    if (!tag) {
      tag = `[Person ${++this.count}]`;
      this.people.set(key, tag);
      this.originals.set(tag, name.trim());
    }
    return tag;
  }

  /** The placeholder for a name already seen, by full name or by any part of it. */
  knownPerson(word: string): string | undefined {
    return this.people.get(normaliseName(word));
  }

  alias(part: string, tag: string) {
    const key = normaliseName(part);
    if (!this.people.has(key)) this.people.set(key, tag);
  }

  term(term: string): string {
    const key = term.trim().toLowerCase();
    let tag = this.terms.get(key);
    if (!tag) {
      tag = `[Private ${this.terms.size + 1}]`;
      this.terms.set(key, tag);
    }
    return tag;
  }

  get isEmpty() {
    return this.people.size === 0 && this.terms.size === 0;
  }
}

const normaliseName = (name: string) => name.trim().replace(/\s+/g, " ").replace(/['’]s$/, "").toLowerCase();
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every whole-word, case-insensitive occurrence of a term. */
export function termSpans(text: string, term: string): Span[] {
  const t = term.trim();
  if (t.length < 2) return [];
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(t).replace(/\s+/g, "\\s+")}(?![\\p{L}\\p{N}])`, "giu");
  return [...text.matchAll(pattern)].map((m) => [m.index!, m.index! + m[0].length]);
}

/** Name parts worth matching on their own: three letters or more, not initials or titles. */
function nameParts(name: string): string[] {
  const skip = new Set(["bin", "binte", "bint", "al", "el", "van", "von", "de", "da", "dr", "mr", "mrs", "ms", "prof", "s/o", "d/o"]);
  return name
    .split(/\s+/)
    .map((p) => p.replace(/[.,]$/, ""))
    .filter((p) => p.length >= 3 && !skip.has(p.toLowerCase()));
}

interface Replacement {
  start: number;
  end: number;
  tag: string;
}

/**
 * Replaces people and private terms in `text` with placeholders. `detected` are spans found by
 * the name model and the name lists. Overlaps are resolved in favour of the longer span.
 */
export function protect(text: string, detected: Span[], hints: PrivacyHints, vault: Vault): string {
  const found: Replacement[] = [];

  for (const term of hints.privateTerms ?? []) {
    for (const [start, end] of termSpans(text, term)) found.push({ start, end, tag: vault.term(term) });
  }

  // Known people: the full name anywhere (any case), and each part when capitalised.
  for (const name of hints.knownPeople ?? []) {
    if (!name?.trim()) continue;
    const tag = vault.person(name);
    for (const [start, end] of termSpans(text, name)) found.push({ start, end, tag });
    for (const part of nameParts(name)) {
      vault.alias(part, tag);
      for (const [start, end] of termSpans(text, part)) {
        if (/^\p{Lu}/u.test(text.slice(start, end))) found.push({ start, end, tag });
      }
    }
  }

  // Names the model or the lists found. A single word that matches part of a known or earlier
  // name reuses that person's placeholder.
  // In order of appearance, skipping spans inside a longer one ("Lim" within "Lim Mei Ling").
  const outer = detected.filter(([s, e]) => !detected.some(([s2, e2]) => s2 <= s && e <= e2 && e2 - s2 > e - s));
  for (const [start, end] of [...outer].sort((a, b) => a[0] - b[0])) {
    const span = text.slice(start, end).replace(/['’]s$/, "");
    if (!span.trim()) continue;
    const tag = vault.knownPerson(span) ?? vault.person(span);
    found.push({ start, end: start + span.length, tag });
    for (const part of nameParts(span)) vault.alias(part, tag);
  }

  // Later mentions of a part of a detected name ("Priya" after "Priya Raman"), when capitalised.
  for (const m of text.matchAll(/\p{Lu}[\p{L}'’-]{2,}/gu)) {
    const word = m[0].replace(/['’]s$/, "");
    const tag = vault.knownPerson(word);
    if (tag?.startsWith("[Person")) found.push({ start: m.index!, end: m.index! + word.length, tag });
  }

  return apply(text, found);
}

function apply(text: string, found: Replacement[]): string {
  const chosen: Replacement[] = [];
  for (const r of [...found].sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start))) {
    const last = chosen[chosen.length - 1];
    if (last && r.start < last.end) {
      // Overlap: keep the longer of the two.
      if (r.end - r.start > last.end - last.start) chosen[chosen.length - 1] = r;
      continue;
    }
    chosen.push(r);
  }
  let out = "";
  let at = 0;
  for (const r of chosen) {
    out += text.slice(at, r.start) + r.tag;
    at = r.end;
  }
  return out + text.slice(at);
}

const PERSON_TAG = /\[person (\d+)\]/gi;
const PRIVATE_TAG = /\[private (\d+)\]/gi;

/**
 * Puts names back into text the model wrote. Private terms are never put back. With
 * `restorePeople` off, a placeholder left in the text becomes "a colleague".
 */
export function restore(text: string, vault: Vault, restorePeople = true): string {
  return text
    .replace(PERSON_TAG, (tag) => (restorePeople ? (vault.originals.get(`[Person ${tag.match(/\d+/)![0]}]`) ?? "a colleague") : "a colleague"))
    .replace(PRIVATE_TAG, "[private]");
}

/** `restore` applied to every string in a parsed AI response. */
export function restoreDeep<T>(value: T, vault: Vault, restorePeople = true): T {
  if (typeof value === "string") return restore(value, vault, restorePeople) as T;
  if (Array.isArray(value)) return value.map((v) => restoreDeep(v, vault, restorePeople)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, restoreDeep(v, vault, restorePeople)])) as T;
  }
  return value;
}

/** Told to the model on every call, so it keeps placeholders intact and never guesses a name. */
export const PLACEHOLDER_RULES = `People's names in the user's text have been replaced with placeholders such as [Person 1], and confidential terms with placeholders such as [Private 1]. When you refer to one of these people, write the placeholder exactly as it appears; never guess or invent a name. Never write a [Private ...] placeholder in your answer: describe that thing generically, or leave it out.`;
