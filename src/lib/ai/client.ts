import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { requireEnv } from "@/lib/config/env";
import { protectPrompt } from "@/lib/privacy/detect";
import type { PrivacyHints } from "@/lib/privacy/pseudonymise";
import { type AiTask, type Effort, PROVIDER_PREFERENCES, effortForTask, modelForTask } from "./models";

/** OpenRouter's Anthropic-compatible API; the SDK appends `/v1/messages`. */
const OPENROUTER_BASE_URL = "https://openrouter.ai/api";

export class AiRefusalError extends Error {
  constructor(public readonly category: string | null) {
    super("The AI declined this request.");
    this.name = "AiRefusalError";
  }
}

export class AiOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiOutputError";
  }
}

export interface AiUsage {
  /** The product function, or an evaluation step such as "eval_judge". */
  task: AiTask | `eval_${string}`;
  model: string;
  provider: string | null;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number | null;
  stopReason: string | null;
}

export type UsageRecorder = (usage: AiUsage) => Promise<void> | void;

/** Fields OpenRouter adds to Anthropic's response format. */
interface OpenRouterExtras {
  provider?: string;
  usage: { cost?: number | null };
}

let client: Anthropic | undefined;

function getClient(): Anthropic {
  client ??= new Anthropic({
    baseURL: OPENROUTER_BASE_URL,
    apiKey: null,
    authToken: requireEnv("OPENROUTER_API_KEY"),
  });
  return client;
}

/**
 * Runs one AI task and returns output validated against `schema`.
 * Stable instructions go in `system`; per-user data goes in `prompt`.
 *
 * People's names and private terms are swapped for placeholders on our own server before the
 * prompt leaves it (src/lib/privacy), and names are put back in the answer. If the private name
 * check can't run, this throws and nothing is sent.
 */
export async function runStructured<Schema extends z.ZodType>(params: {
  task: AiTask;
  system: string;
  prompt: string;
  schema: Schema;
  privacy?: PrivacyHints;
  maxTokens?: number;
  onUsage?: UsageRecorder;
}): Promise<z.infer<Schema>> {
  const guarded = await protectPrompt(params.system, params.prompt, params.privacy);
  const result = await runWithModel({
    ...params,
    system: guarded.system,
    prompt: guarded.prompt,
    model: modelForTask(params.task),
    effort: effortForTask(params.task),
  });
  return guarded.reveal(result);
}

/**
 * The same call with an explicit model and effort. Product code uses runStructured, which pins
 * both per function; the evaluation harness uses this for baselines and the grader.
 */
export async function runWithModel<Schema extends z.ZodType>(params: {
  task: AiUsage["task"];
  model: string;
  effort: Effort;
  system: string;
  prompt: string;
  schema: Schema;
  maxTokens?: number;
  onUsage?: UsageRecorder;
}): Promise<z.infer<Schema>> {
  const format = zodOutputFormat(params.schema);
  const request: Anthropic.MessageCreateParamsNonStreaming & { provider: typeof PROVIDER_PREFERENCES } = {
    model: params.model,
    max_tokens: params.maxTokens ?? 16000,
    system: [{ type: "text", text: params.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: params.prompt }],
    output_config: { effort: params.effort, format },
    provider: PROVIDER_PREFERENCES,
  };
  // `create`, not `parse`: the stop reason must be checked before parsing, because a
  // refused or cut-off response is not valid JSON.
  const response = await getClient().messages.create(request);
  const extras = response as unknown as OpenRouterExtras;

  await params.onUsage?.({
    task: params.task,
    model: response.model,
    provider: extras.provider ?? null,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    costUsd: extras.usage.cost ?? null,
    stopReason: response.stop_reason,
  });

  if (response.stop_reason === "refusal") {
    throw new AiRefusalError(response.stop_details?.category ?? null);
  }
  if (response.stop_reason === "max_tokens") {
    throw new AiOutputError("The AI response was cut off before it finished.");
  }
  const text = response.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
  try {
    return format.parse(text);
  } catch {
    throw new AiOutputError("The AI response did not match the expected format.");
  }
}
