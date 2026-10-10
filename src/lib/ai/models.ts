export const AI_TASKS = ["extract_wins", "post_ideas", "draft_post", "check_draft", "draft_comments"] as const;
export type AiTask = (typeof AI_TASKS)[number];

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

/** Every task defaults to Claude Opus 5.5. Override per task with AI_MODEL_<TASK>. */
export const DEFAULT_MODEL = "claude-opus-5-5";

const TASK_EFFORT: Record<AiTask, Effort> = {
  extract_wins: "low",
  post_ideas: "medium",
  draft_post: "high",
  check_draft: "medium",
  draft_comments: "medium",
};

/** Models that accept the server-side refusal fallback (`fallbacks: "default"`). */
const SERVER_FALLBACK_MODELS = new Set(["claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"]);

export function modelForTask(task: AiTask, env: Record<string, string | undefined> = process.env): string {
  const override = env[`AI_MODEL_${task.toUpperCase()}`]?.trim();
  return override || DEFAULT_MODEL;
}

export function effortForTask(task: AiTask): Effort {
  return TASK_EFFORT[task];
}

export function supportsServerFallback(model: string): boolean {
  return SERVER_FALLBACK_MODELS.has(model);
}
