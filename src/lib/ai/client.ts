import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { requireEnv } from "@/lib/config/env";
import { type AiTask, effortForTask, modelForTask, supportsServerFallback } from "./models";

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
  task: AiTask;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  stopReason: string | null;
}

export type UsageRecorder = (usage: AiUsage) => Promise<void> | void;

let client: Anthropic | undefined;

function getClient(): Anthropic {
  client ??= new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  return client;
}

/**
 * Runs one AI task and returns output validated against `schema`.
 * Stable instructions go in `system`; per-user data goes in `prompt`.
 */
export async function runStructured<Schema extends z.ZodType>(params: {
  task: AiTask;
  system: string;
  prompt: string;
  schema: Schema;
  maxTokens?: number;
  onUsage?: UsageRecorder;
}): Promise<z.infer<Schema>> {
  const model = modelForTask(params.task);
  const fallback = supportsServerFallback(model)
    ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
    : {};

  const response = await getClient().beta.messages.parse({
    model,
    max_tokens: params.maxTokens ?? 16000,
    system: [{ type: "text", text: params.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: params.prompt }],
    output_config: {
      effort: effortForTask(params.task),
      format: betaZodOutputFormat(params.schema),
    },
    ...fallback,
  });

  await params.onUsage?.({
    task: params.task,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    stopReason: response.stop_reason,
  });

  if (response.stop_reason === "refusal") {
    throw new AiRefusalError(response.stop_details?.category ?? null);
  }
  if (response.stop_reason === "max_tokens") {
    throw new AiOutputError("The AI response was cut off before it finished.");
  }
  if (!response.parsed_output) {
    throw new AiOutputError("The AI response did not match the expected format.");
  }
  return response.parsed_output as z.infer<Schema>;
}
