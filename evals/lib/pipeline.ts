import type { UsageRecorder } from "@/lib/ai/client";
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

export function pipelineExtract(c: NoteCase, persona: Persona, onUsage?: UsageRecorder) {
  return extractWins({ text: c.text, ctx: contextFor(persona), onUsage });
}

export async function pipelineIdeas(c: IdeaCase, persona: Persona, onUsage?: UsageRecorder) {
  const ideas = await generatePostIdeas({ wins: c.wins.map((w) => toWin(persona, w)), ctx: contextFor(persona), count: 3, onUsage });
  return { ideas: ideas.map((i) => ({ format: i.format, angle: i.angle, hook: i.hook, source_win_ids: i.sourceWinIds })) };
}

export async function pipelineDraft(c: DraftCase, persona: Persona, onUsage?: UsageRecorder) {
  const wins = c.wins.map((w) => toWin(persona, w));
  const result = await draftPost({
    idea: { format: c.format, angle: c.angle, hook: c.hook, sourceWinIds: wins.map((w) => w.id) },
    wins,
    ctx: contextFor(persona),
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
