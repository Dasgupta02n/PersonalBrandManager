// Model settings for every AI function, live and planned. Calls go through OpenRouter, so
// model ids are OpenRouter slugs. Each function is pinned to one model: there is no
// automatic model switching. Override a function's model with AI_MODEL_<TASK>.

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

interface TaskSetting {
  model: string;
  effort: Effort;
  /** False for functions in the plan that have no code yet. */
  live: boolean;
}

export const OPUS = "anthropic/claude-opus-5.5";

export const TASK_SETTINGS = {
  // Daily capture and creation
  extract_wins: { model: OPUS, effort: "low", live: true },
  verify_wins: { model: OPUS, effort: "medium", live: true },
  post_ideas: { model: OPUS, effort: "medium", live: true },
  verify_ideas: { model: OPUS, effort: "medium", live: true },
  draft_post: { model: OPUS, effort: "high", live: true },
  select_draft: { model: OPUS, effort: "high", live: true },
  check_draft: { model: OPUS, effort: "high", live: true },
  how_it_reads: { model: OPUS, effort: "high", live: true },
  revise_draft: { model: OPUS, effort: "medium", live: true },
  // Engagement
  comment_starters: { model: OPUS, effort: "medium", live: true },
  draft_reply: { model: OPUS, effort: "medium", live: false },
  read_post_screenshot: { model: OPUS, effort: "low", live: false },
  // Onboarding imports
  import_profile: { model: OPUS, effort: "medium", live: false },
  import_cv: { model: OPUS, effort: "medium", live: false },
  voice_profile: { model: OPUS, effort: "high", live: true },
  // Weekly refresh and scorecard
  profile_suggestions: { model: OPUS, effort: "high", live: true },
  cv_update: { model: OPUS, effort: "high", live: false },
  read_reach_screenshot: { model: OPUS, effort: "low", live: false },
  weekly_summary: { model: OPUS, effort: "medium", live: false },
} as const satisfies Record<string, TaskSetting>;

export type AiTask = keyof typeof TASK_SETTINGS;

/**
 * Extra quality steps: a fact-checker for wins and ideas, and several drafts with an editor
 * choosing one. Each stays off until the quality bar shows it beats the baseline and its cost
 * fits the plan allowance (src/lib/billing/pricing.ts). The quality bar can switch them on with
 * EVAL_QUALITY.
 * - draftCandidates: 3 since 2026-10-20 (86% against the baseline, evals/reports/2026-10-20-quality-steps.md).
 * - verifyWins, verifyIdeas: not yet measured on enough cases.
 */
export const QUALITY_STEPS = { verifyWins: false, verifyIdeas: false, draftCandidates: 3 };
export type QualitySteps = typeof QUALITY_STEPS;
export const AI_TASKS = Object.keys(TASK_SETTINGS) as AiTask[];

/**
 * Hosts OpenRouter may use: zero data retention only, and only hosts that support every
 * parameter in the request (structured output in particular). Hosts serve the same model.
 */
export const PROVIDER_PREFERENCES = { zdr: true, require_parameters: true } as const;

export function modelForTask(task: AiTask, env: Record<string, string | undefined> = process.env): string {
  const override = env[`AI_MODEL_${task.toUpperCase()}`]?.trim();
  return override || TASK_SETTINGS[task].model;
}

export function effortForTask(task: AiTask): Effort {
  return TASK_SETTINGS[task].effort;
}
