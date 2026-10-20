import type { UsageRecorder } from "@/lib/ai/client";
import type { QualitySteps } from "@/lib/ai/models";
import {
  commentStarters,
  draftPost,
  extractWins,
  generatePostIdeas,
  learnVoice,
  readAsAudience,
  revisePost,
  reviewDraft,
  suggestProfile,
} from "@/lib/ai/tasks";
import { checkText } from "@/lib/guardrails/check";
import { contextFor, toWin } from "./context";
import type { CommentCase, DraftCase, IdeaCase, NoteCase, Persona, ProfileCase, ReadCase, RevisionCase, RiskCase, VoiceCase } from "./schema";

// The product side: each test case run through the real pipeline in src/lib/ai/tasks.ts,
// with the deterministic checks, the AI review and the style notebook the product would have.

/**
 * Quality steps under test, from EVAL_QUALITY (for example "verifyWins,verifyIdeas,draftCandidates=3").
 * Unset, the product runs with its own defaults (QUALITY_STEPS).
 */
export function qualityFromEnv(value = process.env.EVAL_QUALITY): Partial<QualitySteps> {
  const steps: Partial<QualitySteps> = {};
  for (const part of (value ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
    const [key, n] = part.split("=").map((s) => s.trim());
    if (key === "verifyWins" || key === "verifyIdeas") steps[key] = n === undefined ? true : n !== "0";
    else if (key === "draftCandidates") steps.draftCandidates = Number(n);
    else throw new Error(`Unknown EVAL_QUALITY step: ${key}`);
  }
  return steps;
}

export function pipelineExtract(c: NoteCase, persona: Persona, onUsage?: UsageRecorder) {
  return extractWins({ text: c.text, ctx: contextFor(persona), quality: qualityFromEnv(), onUsage });
}

export async function pipelineIdeas(c: IdeaCase, persona: Persona, onUsage?: UsageRecorder) {
  const ideas = await generatePostIdeas({ wins: c.wins.map((w) => toWin(persona, w)), ctx: contextFor(persona), count: 3, quality: qualityFromEnv(), onUsage });
  return { ideas: ideas.map((i) => ({ format: i.format, angle: i.angle, hook: i.hook, source_win_ids: i.sourceWinIds })) };
}

export async function pipelineDraft(c: DraftCase, persona: Persona, onUsage?: UsageRecorder) {
  const wins = c.wins.map((w) => toWin(persona, w));
  const result = await draftPost({
    idea: { format: c.format, angle: c.angle, hook: c.hook, sourceWinIds: wins.map((w) => w.id) },
    wins,
    ctx: contextFor(persona),
    quality: qualityFromEnv(),
    onUsage,
  });
  return { post: result.body, hashtags: result.hashtags, passed: result.report.passed };
}

/** The product's safety check: instant checks plus the AI review, on the post as written. */
export async function pipelineCheck(c: RiskCase, persona: Persona, onUsage?: UsageRecorder) {
  const ctx = contextFor(persona);
  const reviewed = await reviewDraft({ body: c.post, kind: "post", facts: c.facts.map((w) => toWin(persona, w)), ctx, applyFix: false, onUsage });
  const instant = checkText(c.post, { kind: "post", rules: ctx.rules });
  return { report: reviewed.report, issues: instant.issues };
}

export function pipelineReads(c: ReadCase, persona: Persona, onUsage?: UsageRecorder) {
  return readAsAudience({ body: c.post, ctx: contextFor(persona), onUsage });
}

export async function pipelineRevision(c: RevisionCase, persona: Persona, onUsage?: UsageRecorder) {
  const result = await revisePost({ body: c.post, mode: c.mode, facts: c.facts.map((w) => toWin(persona, w)), ctx: contextFor(persona), onUsage });
  return { post: result.body };
}

export function pipelineComments(c: CommentCase, persona: Persona, onUsage?: UsageRecorder) {
  return commentStarters({ postText: c.post, ctx: contextFor(persona), onUsage }).then((options) => ({
    options: options.map((o) => ({ approach: o.approach, starter: o.starter, add: o.add })),
  }));
}

export async function pipelineProfile(c: ProfileCase, persona: Persona, onUsage?: UsageRecorder) {
  const sections = await suggestProfile({ wins: c.wins.map((w) => toWin(persona, w)), current: c.current, ctx: contextFor(persona), onUsage });
  return { sections: sections.map((s) => ({ section: s.section, text: s.text, reason: s.reason })) };
}

export function pipelineVoice(c: VoiceCase, persona: Persona, onUsage?: UsageRecorder) {
  return learnVoice({ samples: persona.samplePosts, pairs: c.pairs, removed: [], rules: persona.rules, onUsage });
}
