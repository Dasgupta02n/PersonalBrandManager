import "server-only";
import type { UserContext, Win } from "@/lib/domain/types";
import { checkText, type GuardrailIssue } from "@/lib/guardrails/check";
import { runStructured, type UsageRecorder } from "./client";
import {
  CHECK_DRAFT_SYSTEM,
  DRAFT_COMMENTS_SYSTEM,
  DRAFT_POST_SYSTEM,
  EXTRACT_WINS_SYSTEM,
  POST_IDEAS_SYSTEM,
  formatUserContext,
  formatWins,
} from "./prompts";
import {
  CommentOptionsSchema,
  DraftCheckSchema,
  ExtractedWinsSchema,
  PostDraftSchema,
  PostIdeasSchema,
} from "./schemas";

export interface NewWin {
  summary: string;
  impact: string;
  metric: string | null;
  skills: string[];
  pillarId: string | null;
  confidential: boolean;
}

/** Splits a daily note into structured wins and an optional follow-up question. */
export async function extractWins(input: {
  text: string;
  ctx: UserContext;
  onUsage?: UsageRecorder;
}): Promise<{ wins: NewWin[]; followUpQuestion: string | null }> {
  const result = await runStructured({
    task: "extract_wins",
    system: EXTRACT_WINS_SYSTEM,
    schema: ExtractedWinsSchema,
    onUsage: input.onUsage,
    prompt: `${formatUserContext(input.ctx)}

Today's note from the user:
<user_data>
${input.text}
</user_data>`,
  });

  const pillarByName = new Map(input.ctx.pillars.map((p) => [p.name.toLowerCase(), p.id]));
  const wins = result.wins
    .filter((w) => w.summary.trim().length > 0)
    .map((w) => ({
      summary: w.summary.trim(),
      impact: w.impact.trim(),
      metric: w.metric?.trim() || null,
      skills: w.skills.map((s) => s.trim()).filter(Boolean).slice(0, 4),
      pillarId: w.pillar ? (pillarByName.get(w.pillar.toLowerCase()) ?? null) : null,
      confidential: w.confidential,
    }));

  return { wins, followUpQuestion: result.follow_up_question?.trim() || null };
}

export interface PostIdea {
  angle: string;
  hook: string;
  sourceWinIds: string[];
}

/** Suggests post ideas grounded in the given wins. Ideas citing unknown wins are dropped. */
export async function generatePostIdeas(input: {
  wins: Win[];
  ctx: UserContext;
  count?: number;
  onUsage?: UsageRecorder;
}): Promise<PostIdea[]> {
  if (!input.wins.length) return [];
  const count = input.count ?? 3;
  const result = await runStructured({
    task: "post_ideas",
    system: POST_IDEAS_SYSTEM,
    schema: PostIdeasSchema,
    onUsage: input.onUsage,
    prompt: `${formatUserContext(input.ctx)}

${formatWins(input.wins)}

Suggest ${count} post ideas.`,
  });

  const known = new Set(input.wins.map((w) => w.id));
  return result.ideas
    .map((idea) => ({
      angle: idea.angle.trim(),
      hook: idea.hook.trim(),
      sourceWinIds: idea.source_win_ids.filter((id) => known.has(id)),
    }))
    .filter((idea) => idea.sourceWinIds.length > 0)
    .slice(0, count);
}

export interface GuardrailReport {
  passed: boolean;
  issues: GuardrailIssue[];
  grounded: boolean;
  unsupportedClaims: string[];
  confidentialityProblems: string[];
  jobSearchSignal: boolean;
  revised: boolean;
}

/**
 * Runs deterministic checks and the AI check. If anything fails, applies the AI's revision
 * once and re-runs the deterministic checks on the revised text.
 */
export async function reviewDraft(input: {
  body: string;
  kind: "post" | "comment" | "reply";
  facts: Win[];
  ctx: UserContext;
  onUsage?: UsageRecorder;
}): Promise<{ body: string; report: GuardrailReport }> {
  const first = checkText(input.body, { kind: input.kind, rules: input.ctx.rules });
  const automaticProblems = first.issues.filter((i) => i.severity === "error").map((i) => `- ${i.message}`);

  const check = await runStructured({
    task: "check_draft",
    system: CHECK_DRAFT_SYSTEM,
    schema: DraftCheckSchema,
    onUsage: input.onUsage,
    prompt: `${formatUserContext(input.ctx)}

Facts the draft may use:
${formatWins(input.facts)}

Automatic checks found:
${automaticProblems.length ? automaticProblems.join("\n") : "- nothing"}

Draft to review:
<draft>
${input.body}
</draft>`,
  });

  const aiFailed = !check.grounded || !check.confidentiality_ok || check.job_search_signal;
  const needsRevision = aiFailed || !first.passed;
  const revisedBody = needsRevision && check.revised_body?.trim() ? check.revised_body.trim() : null;
  const finalBody = revisedBody ?? input.body;
  const final = revisedBody ? checkText(finalBody, { kind: input.kind, rules: input.ctx.rules }) : first;

  return {
    body: finalBody,
    report: {
      passed: final.passed && (!aiFailed || revisedBody !== null),
      issues: final.issues,
      grounded: check.grounded,
      unsupportedClaims: check.unsupported_claims,
      confidentialityProblems: check.confidentiality_problems,
      jobSearchSignal: check.job_search_signal,
      revised: revisedBody !== null,
    },
  };
}

function normalizeHashtags(tags: string[]): string[] {
  const cleaned = tags
    .map((t) => t.trim().replace(/\s+/g, ""))
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`));
  return [...new Set(cleaned)].slice(0, 5);
}

/** Writes a full post for an idea, then reviews it. */
export async function draftPost(input: {
  idea: PostIdea;
  wins: Win[];
  ctx: UserContext;
  onUsage?: UsageRecorder;
}): Promise<{ hook: string; body: string; hashtags: string[]; report: GuardrailReport }> {
  const sourceWins = input.wins.filter((w) => input.idea.sourceWinIds.includes(w.id));
  const draft = await runStructured({
    task: "draft_post",
    system: DRAFT_POST_SYSTEM,
    schema: PostDraftSchema,
    onUsage: input.onUsage,
    prompt: `${formatUserContext(input.ctx)}

${formatWins(sourceWins)}

Write a post with this angle: ${input.idea.angle}
Suggested first line: ${input.idea.hook}`,
  });

  const reviewed = await reviewDraft({
    body: draft.body.trim(),
    kind: "post",
    facts: sourceWins,
    ctx: input.ctx,
    onUsage: input.onUsage,
  });

  return {
    hook: draft.hook.trim(),
    body: reviewed.body,
    hashtags: normalizeHashtags(draft.hashtags),
    report: reviewed.report,
  };
}

/** Drafts comment options for a post the user shared. Each option is checked deterministically. */
export async function draftComments(input: {
  postText: string;
  ctx: UserContext;
  onUsage?: UsageRecorder;
}): Promise<{ approach: string; text: string; issues: GuardrailIssue[] }[]> {
  const result = await runStructured({
    task: "draft_comments",
    system: DRAFT_COMMENTS_SYSTEM,
    schema: CommentOptionsSchema,
    onUsage: input.onUsage,
    prompt: `${formatUserContext(input.ctx)}

<post>
${input.postText.slice(0, 6000)}
</post>`,
  });

  return result.options.slice(0, 3).map((option) => ({
    approach: option.approach.trim(),
    text: option.text.trim(),
    issues: checkText(option.text, { kind: "comment", rules: input.ctx.rules }).issues,
  }));
}
