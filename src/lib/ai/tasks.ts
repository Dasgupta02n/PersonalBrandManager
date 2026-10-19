import "server-only";
import type { PostFormat, UserContext, Win, WinKind } from "@/lib/domain/types";
import { checkText, findTerm, type GuardrailIssue } from "@/lib/guardrails/check";
import { runStructured, type UsageRecorder } from "./client";
import {
  CHECK_DRAFT_SYSTEM,
  COMMENT_STARTERS_SYSTEM,
  DRAFT_POST_SYSTEM,
  EXTRACT_WINS_SYSTEM,
  HOW_IT_READS_SYSTEM,
  POST_IDEAS_SYSTEM,
  PROFILE_SUGGESTIONS_SYSTEM,
  VOICE_PROFILE_SYSTEM,
  REVISE_INSTRUCTIONS,
  REVISE_POST_SYSTEM,
  formatUserContext,
  formatWins,
  type RevisionMode,
} from "./prompts";
import {
  CommentStartersSchema,
  DraftCheckSchema,
  ExtractedWinsSchema,
  HowItReadsSchema,
  PostDraftSchema,
  PostIdeasSchema,
  ProfileSuggestionsSchema,
  VoiceProfileSchema,
  RevisionSchema,
} from "./schemas";

export type { RevisionMode } from "./prompts";

export interface NewWin {
  summary: string;
  impact: string;
  metric: string | null;
  skills: string[];
  pillarId: string | null;
  confidential: boolean;
  kind: WinKind;
}

/** Splits a daily note into structured wins and an optional follow-up question. */
export async function extractWins(input: {
  text: string;
  ctx: UserContext;
  onUsage?: UsageRecorder;
}): Promise<{ wins: NewWin[]; followUpQuestion: string | null; maskedNote: string | null }> {
  const keepNamesOut = input.ctx.rules.maskNames
    ? `

Keep names out: in summaries, impact and the follow-up question, refer to people other than the user by their role ` +
      `("a colleague", "my manager", "the client's CFO") and to never-mention terms generically ("a client", "a partner"). ` +
      `Return masked_note.`
    : "\n\nReturn masked_note as null.";
  const result = await runStructured({
    task: "extract_wins",
    system: EXTRACT_WINS_SYSTEM,
    schema: ExtractedWinsSchema,
    onUsage: input.onUsage,
    prompt: `${formatUserContext(input.ctx)}

Today's note from the user:
<user_data>
${input.text}
</user_data>${keepNamesOut}`,
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
      kind: w.kind,
    }));

  return {
    wins,
    followUpQuestion: result.follow_up_question?.trim() || null,
    maskedNote: input.ctx.rules.maskNames ? result.masked_note?.trim() || null : null,
  };
}

export interface PostIdea {
  format: PostFormat;
  angle: string;
  hook: string;
  sourceWinIds: string[];
}

/** Suggests post ideas grounded in the given wins, best first. Ideas citing unknown wins are dropped. */
export async function generatePostIdeas(input: {
  wins: Win[];
  ctx: UserContext;
  count?: number;
  avoidAngles?: string[];
  onUsage?: UsageRecorder;
}): Promise<PostIdea[]> {
  if (!input.wins.length) return [];
  const count = input.count ?? 3;
  const avoid = input.avoidAngles?.length
    ? `\n\nThe user has already seen these angles; suggest different ones:\n${input.avoidAngles.map((a) => `- ${a}`).join("\n")}`
    : "";
  const result = await runStructured({
    task: "post_ideas",
    system: POST_IDEAS_SYSTEM,
    schema: PostIdeasSchema,
    onUsage: input.onUsage,
    prompt: `${formatUserContext(input.ctx)}

${formatWins(input.wins)}

Suggest ${count} post ideas, each in a different format where possible.${avoid}`,
  });

  const known = new Set(input.wins.map((w) => w.id));
  return result.ideas
    .map((idea) => ({
      format: idea.format,
      angle: idea.angle.trim(),
      hook: idea.hook.trim(),
      sourceWinIds: idea.source_win_ids.filter((id) => known.has(id)),
    }))
    .filter((idea) => idea.sourceWinIds.length > 0)
    .slice(0, count);
}

export type Reader = "peer" | "leadership" | "client_or_recruiter";

/** A prediction of how people who know the author would read the post. */
export interface HowItReads {
  verdict: "confident" | "boastful" | "too_modest" | "generic";
  soundsLikeYou: boolean | null;
  readers: { reader: Reader; readsAs: string; concern: string | null }[];
  lines: {
    quote: string;
    issue: "boastful" | "humblebrag" | "sounds_ai" | "unclear" | "takes_sole_credit";
    suggestion: string;
  }[];
}

export interface GuardrailReport {
  passed: boolean;
  issues: GuardrailIssue[];
  grounded: boolean;
  unsupportedClaims: string[];
  confidentialityProblems: string[];
  jobSearchSignal: boolean;
  noGoTopics: string[];
  hierarchyRisk: string | null;
  revised: boolean;
  howItReads: HowItReads | null;
  /** True after the user edits the text by hand, until the AI checks run again. */
  aiStale?: boolean;
}

/** Reports saved before a field existed are read with safe defaults. */
export function normalizeReport(raw: Partial<GuardrailReport> | null | undefined): GuardrailReport | null {
  if (!raw) return null;
  return {
    passed: raw.passed ?? false,
    issues: raw.issues ?? [],
    grounded: raw.grounded ?? true,
    unsupportedClaims: raw.unsupportedClaims ?? [],
    confidentialityProblems: raw.confidentialityProblems ?? [],
    jobSearchSignal: raw.jobSearchSignal ?? false,
    noGoTopics: raw.noGoTopics ?? [],
    hierarchyRisk: raw.hierarchyRisk ?? null,
    revised: raw.revised ?? false,
    howItReads: raw.howItReads ?? null,
    aiStale: raw.aiStale ?? false,
  };
}

/**
 * Runs deterministic checks and the AI check. If anything fails, the AI's fix is applied once
 * (or, with `applyFix: false`, returned as a suggestion so the user's own edits are never
 * overwritten) and the deterministic checks re-run on the result.
 */
export async function reviewDraft(input: {
  body: string;
  kind: "post" | "comment" | "reply";
  facts: Win[];
  ctx: UserContext;
  applyFix?: boolean;
  onUsage?: UsageRecorder;
}): Promise<{ body: string; suggestedBody: string | null; report: Omit<GuardrailReport, "howItReads"> }> {
  const applyFix = input.applyFix ?? true;
  const first = checkText(input.body, { kind: input.kind, rules: input.ctx.rules, avoidWords: input.ctx.voice.avoidWords });
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

  const noGo = check.no_go_topic_hits.map((t) => t.trim()).filter(Boolean);
  const aiFailed = !check.grounded || !check.confidentiality_ok || check.job_search_signal || noGo.length > 0;
  const needsFix = aiFailed || !first.passed || Boolean(check.hierarchy_risk);
  const fix = needsFix && check.revised_body?.trim() ? check.revised_body.trim() : null;
  const applied = applyFix ? fix : null;
  const finalBody = applied ?? input.body;
  const final = applied ? checkText(finalBody, { kind: input.kind, rules: input.ctx.rules, avoidWords: input.ctx.voice.avoidWords }) : first;

  return {
    body: finalBody,
    suggestedBody: applyFix ? null : fix,
    report: {
      passed: final.passed && (!aiFailed || applied !== null),
      issues: final.issues,
      grounded: check.grounded,
      unsupportedClaims: check.unsupported_claims,
      confidentialityProblems: check.confidentiality_problems,
      jobSearchSignal: check.job_search_signal,
      noGoTopics: noGo,
      hierarchyRisk: check.hierarchy_risk?.trim() || null,
      revised: applied !== null,
    },
  };
}

/** Predicts how a peer, the user's leadership and a client or recruiter would read the post. */
export async function readAsAudience(input: { body: string; ctx: UserContext; onUsage?: UsageRecorder }): Promise<HowItReads> {
  const result = await runStructured({
    task: "how_it_reads",
    system: HOW_IT_READS_SYSTEM,
    schema: HowItReadsSchema,
    onUsage: input.onUsage,
    prompt: `${formatUserContext(input.ctx)}

Post:
<draft>
${input.body}
</draft>`,
  });

  // Keep only quotes that really appear in the post, once each.
  const lines: HowItReads["lines"] = [];
  for (const line of result.lines) {
    const quote = line.quote.trim();
    if (!quote || !input.body.includes(quote) || lines.some((l) => l.quote === quote)) continue;
    lines.push({ quote, issue: line.issue, suggestion: line.suggestion.trim() });
  }

  return {
    verdict: result.verdict,
    soundsLikeYou: input.ctx.voice.samplePosts.length || input.ctx.voice.notes.length ? result.sounds_like_user : null,
    readers: result.readers.slice(0, 3).map((r) => ({
      reader: r.reader,
      readsAs: r.reads_as.trim(),
      concern: r.concern?.trim() || null,
    })),
    lines: lines.slice(0, 4),
  };
}

function normalizeHashtags(tags: string[]): string[] {
  const cleaned = tags
    .map((t) => t.trim().replace(/\s+/g, ""))
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`));
  return [...new Set(cleaned)].slice(0, 3);
}

/** Checks a post and predicts how it reads: the full "nothing you'll regret posting" pass. */
async function reviewPost(input: { body: string; facts: Win[]; ctx: UserContext; onUsage?: UsageRecorder }) {
  const reviewed = await reviewDraft({ ...input, kind: "post" });
  const howItReads = await readAsAudience({ body: reviewed.body, ctx: input.ctx, onUsage: input.onUsage });
  return { body: reviewed.body, report: { ...reviewed.report, howItReads } satisfies GuardrailReport };
}

/** Writes a full post for an idea, then checks it and predicts how it reads. */
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

Format: ${input.idea.format}
Write a post with this angle: ${input.idea.angle}
Suggested first line: ${input.idea.hook}`,
  });

  const reviewed = await reviewPost({ body: draft.body.trim(), facts: sourceWins, ctx: input.ctx, onUsage: input.onUsage });
  return {
    hook: draft.hook.trim(),
    body: reviewed.body,
    hashtags: normalizeHashtags(draft.hashtags),
    report: reviewed.report,
  };
}

/** One-tap revision (shorter, humbler, stronger opening), then the full review again. */
export async function revisePost(input: {
  body: string;
  mode: RevisionMode;
  facts: Win[];
  ctx: UserContext;
  onUsage?: UsageRecorder;
}): Promise<{ body: string; report: GuardrailReport }> {
  const revision = await runStructured({
    task: "revise_draft",
    system: REVISE_POST_SYSTEM,
    schema: RevisionSchema,
    onUsage: input.onUsage,
    prompt: `${formatUserContext(input.ctx)}

${formatWins(input.facts)}

Instruction: ${REVISE_INSTRUCTIONS[input.mode]}

Post:
<draft>
${input.body}
</draft>`,
  });
  return reviewPost({ body: revision.body.trim() || input.body, facts: input.facts, ctx: input.ctx, onUsage: input.onUsage });
}

/** Re-checks the user's own edits without rewriting them; any fix comes back as a suggestion. */
export async function recheckPost(input: { body: string; facts: Win[]; ctx: UserContext; onUsage?: UsageRecorder }) {
  const reviewed = await reviewDraft({ ...input, kind: "post", applyFix: false });
  const howItReads = await readAsAudience({ body: input.body, ctx: input.ctx, onUsage: input.onUsage });
  return { suggestedBody: reviewed.suggestedBody, report: { ...reviewed.report, howItReads } satisfies GuardrailReport };
}

/** Comment openings for a post the user shared. The user finishes each one in their own words. */
export async function commentStarters(input: {
  postText: string;
  ctx: UserContext;
  onUsage?: UsageRecorder;
}): Promise<{ approach: string; starter: string; add: string; issues: GuardrailIssue[] }[]> {
  const result = await runStructured({
    task: "comment_starters",
    system: COMMENT_STARTERS_SYSTEM,
    schema: CommentStartersSchema,
    onUsage: input.onUsage,
    prompt: `${formatUserContext(input.ctx)}

<post>
${input.postText.slice(0, 6000)}
</post>`,
  });

  return result.options.slice(0, 3).map((option) => ({
    approach: option.approach.trim(),
    starter: option.starter.trim(),
    add: option.add.trim(),
    issues: checkText(option.starter, { kind: "comment", rules: input.ctx.rules, avoidWords: input.ctx.voice.avoidWords }).issues,
  }));
}

export type ProfileSection = "headline" | "about" | "experience" | "cv" | "skills";

export interface ProfileSuggestion {
  section: ProfileSection;
  text: string;
  reason: string;
  issues: GuardrailIssue[];
}

/**
 * Profile and CV suggestions from the record, each checked like a post (confidentiality,
 * employer policy, figures, job-search signals). Length rules for posts don't apply here.
 */
export async function suggestProfile(input: {
  wins: Win[];
  current: { headline: string; about: string; experience: string };
  ctx: UserContext;
  onUsage?: UsageRecorder;
}): Promise<ProfileSuggestion[]> {
  const shared = [
    input.current.headline && `Current headline:\n${input.current.headline}`,
    input.current.about && `Current About:\n${input.current.about}`,
    input.current.experience && `Current role bullets or CV lines:\n${input.current.experience}`,
  ].filter(Boolean);

  const result = await runStructured({
    task: "profile_suggestions",
    system: PROFILE_SUGGESTIONS_SYSTEM,
    schema: ProfileSuggestionsSchema,
    onUsage: input.onUsage,
    prompt: `${formatUserContext(input.ctx)}

${formatWins(input.wins)}

${shared.length ? `What the user has today:\n<user_data>\n${shared.join("\n\n")}\n</user_data>` : "The user has not shared their current profile."}`,
  });

  const check = (text: string) =>
    checkText(text, { kind: "comment", rules: input.ctx.rules, commentMaxWords: 10_000 }).issues.filter((i) => i.code !== "length");
  const list = (items: string[]) => items.map((b) => b.trim()).filter(Boolean);

  const sections: Omit<ProfileSuggestion, "issues">[] = [
    { section: "headline", text: result.headline.text.trim().slice(0, 220), reason: result.headline.reason.trim() },
    { section: "about", text: result.about.text.trim(), reason: result.about.reason.trim() },
    { section: "experience", text: list(result.experience.bullets).slice(0, 5).map((b) => `• ${b}`).join("\n"), reason: result.experience.reason.trim() },
    { section: "cv", text: list(result.cv.bullets).slice(0, 6).map((b) => `• ${b}`).join("\n"), reason: result.cv.reason.trim() },
    { section: "skills", text: list(result.skills.items).slice(0, 8).join(", "), reason: result.skills.reason.trim() },
  ];
  return sections.filter((s) => s.text).map((s) => ({ ...s, issues: check(s.text) }));
}

/**
 * Learns how the user writes from their samples and their edits (what we drafted, what they
 * posted). Style only: observations that mention a never-mention term or the employer are dropped.
 */
export async function learnVoice(input: {
  samples: string[];
  pairs: { drafted: string; posted: string }[];
  removed: string[];
  rules: UserContext["rules"];
  onUsage?: UsageRecorder;
}): Promise<{ summary: string; notes: string[] }> {
  const samples = input.samples.slice(0, 3).map((s, i) => `Sample ${i + 1}:\n${s.slice(0, 1500)}`);
  const pairs = input.pairs
    .slice(0, 5)
    .map((p, i) => `Pair ${i + 1}\nDrafted for them:\n${p.drafted.slice(0, 1500)}\nWhat they posted:\n${p.posted.slice(0, 1500)}`);

  const result = await runStructured({
    task: "voice_profile",
    system: VOICE_PROFILE_SYSTEM,
    schema: VoiceProfileSchema,
    onUsage: input.onUsage,
    prompt: `<user_data>
${samples.length ? samples.join("\n\n") : "No sample posts."}

${pairs.length ? pairs.join("\n\n") : "No edited posts yet."}
</user_data>
${input.removed.length ? `\nThe user removed these observations; never repeat them:\n${input.removed.map((r) => `- ${r}`).join("\n")}` : ""}`,
  });

  const privateTerms = [...input.rules.neverMention, ...(input.rules.employerName ? [input.rules.employerName] : [])];
  const notes = result.notes
    .map((n) => n.trim())
    .filter((n) => n && n.length <= 120 && !privateTerms.some((term) => findTerm(n, term)))
    .slice(0, 8);
  return { summary: result.summary.trim().slice(0, 300), notes };
}
