import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { z } from "zod";
import type { AiUsage, UsageRecorder } from "@/lib/ai/client";
import { CommentStartersSchema, ExtractedWinsSchema, HowItReadsSchema, ProfileSuggestionsSchema, VoiceProfileSchema } from "@/lib/ai/schemas";
import { POST_FORMATS } from "@/lib/domain/types";
import { estimateCallCost } from "@/lib/billing/pricing";
import * as base from "./baselines";
import { briefFor, winsText } from "./context";
import { isCreditError } from "./credit";
import { comparePair, traitCoverage, type PairResult, type RubricName } from "./judge";
import { load } from "./load";
import * as m from "./metrics";
import * as product from "./pipeline";
import type { DatasetName, Persona, RiskCategory } from "./schema";
import { beatsBaseline, ci, pct, wilson, winRate, type WinRate } from "./stats";

// Runs each function through the product and the baseline on the same cases, grades them, and
// scores the plain-code metrics. Every call's real cost is recorded.

export const FUNCTIONS = ["extract", "ideas", "draft", "check", "reads", "revision", "comments", "profile", "voice"] as const;
export type FunctionName = (typeof FUNCTIONS)[number];

const DATASET: Record<FunctionName, DatasetName> = {
  extract: "notes",
  ideas: "ideas",
  draft: "drafts",
  check: "risks",
  reads: "reads",
  revision: "revisions",
  comments: "comments",
  profile: "profiles",
  voice: "voices",
};

/** Cost per case (product + baseline + grading), from the first real run (2026-10-20) where measured. */
export const COST_PER_CASE: Record<FunctionName, number> = {
  extract: 0.08,
  ideas: 0.12,
  draft: 0.19,
  check: 0.05,
  reads: 0.07,
  revision: 0.17,
  comments: 0.13,
  profile: 0.22,
  voice: 0.15,
};

export interface RunOptions {
  functions: FunctionName[];
  limit: number;
  /** Per-function overrides of `limit`. */
  limits?: Partial<Record<FunctionName, number>>;
  seed: number;
  concurrency: number;
  judge: boolean;
  /** Hard cap in US dollars across the whole run: no new case or grading starts once it is reached. */
  budget?: number;
  /** Outputs from an earlier run to use again instead of paying for them twice. */
  reuse?: Reuse;
}

/** Fingerprint of a case and its persona: an earlier output is reused only if neither has changed. */
export const caseHash = (c: unknown, p: unknown) => createHash("sha256").update(JSON.stringify([c, p])).digest("hex").slice(0, 16);

/** Fingerprint of the baseline prompts and the schemas they use: earlier baseline outputs are reused only while these are unchanged. */
export const BASELINE_SOURCE = createHash("sha256")
  .update(
    [
      ...["./baselines.ts", "./context.ts", "./schema.ts"].map((f) => readFileSync(new URL(f, import.meta.url), "utf8")),
      ...[CommentStartersSchema, ExtractedWinsSchema, HowItReadsSchema, ProfileSuggestionsSchema, VoiceProfileSchema].map((s) => JSON.stringify(z.toJSONSchema(s))),
      JSON.stringify(POST_FORMATS),
    ].join("\n"),
  )
  .digest("hex")
  .slice(0, 16);

export interface Reuse {
  previous: Partial<Record<FunctionName, { baselineSource?: string; outputs: Map<string, { caseHash?: string; product: unknown; baseline: unknown }> }>>;
  /** Functions whose product pipeline hasn't changed since that run, so their product outputs can be reused too. */
  product: FunctionName[];
}

/** Earlier outputs from a run's results.json. Grading always runs again. */
export function loadReuse(reports: Pick<FunctionReport, "fn" | "baselineSource" | "outputs">[], product: FunctionName[]): Reuse {
  return {
    product,
    previous: Object.fromEntries(reports.map((r) => [r.fn, { baselineSource: r.baselineSource, outputs: new Map(r.outputs.map((o) => [o.caseId, o])) }])),
  };
}

/** Where a capped budget goes first: the promise, then the core writing, then the rest. */
export const PRIORITY: FunctionName[] = ["check", "draft", "reads", "extract", "ideas", "revision", "comments", "profile", "voice"];

/** Spend so far in this process, across every function and side. */
let spent = 0;
export const spentSoFar = () => spent;

/** Set when OpenRouter refuses a call for lack of credit: nothing new starts after that. */
let outOfCredit = false;
export const stoppedForCredit = () => outOfCredit;

const casesFor = (fn: FunctionName, opts: Pick<RunOptions, "limit" | "limits">) => opts.limits?.[fn] ?? opts.limit;

export interface Metric {
  label: string;
  product: string;
  baseline: string;
}

export interface PairRecord {
  fn: FunctionName;
  caseId: string;
  context: string;
  product: string;
  baseline: string;
  result: PairResult | null;
}

export interface FunctionReport {
  fn: FunctionName;
  cases: number;
  /** Cases not run, or not graded, because the budget ran out. */
  skippedForBudget: number;
  /** Outputs taken from an earlier run instead of generated again. */
  reused: { product: number; baseline: number };
  baselineSource: string;
  errors: { side: "product" | "baseline" | "judge"; caseId: string; message: string }[];
  cost: { product: number; baseline: number; judge: number };
  metrics: Metric[];
  rate: WinRate | null;
  criteria: Record<string, WinRate>;
  gate: { rule: string; passed: boolean } | null;
  pairs: PairRecord[];
  /** Every case's raw output from both sides, for diagnosing results. */
  outputs: { caseId: string; caseHash: string; product: unknown; baseline: unknown }[];
}

// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fixed-seed sample, so runs with the same seed compare the same cases. */
export function sample<T>(rows: T[], limit: number, seed: number): T[] {
  const random = mulberry32(seed);
  const copy = [...rows];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return limit > 0 ? copy.slice(0, limit) : copy;
}

async function pool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

function meter(): { record: UsageRecorder; total: () => number } {
  let total = 0;
  return {
    record: (u: AiUsage) => {
      const cost =
        u.costUsd ??
        estimateCallCost(u.model, { input: u.inputTokens, output: u.outputTokens, cacheRead: u.cacheReadTokens, cacheWrite: u.cacheWriteTokens });
      total += cost;
      spent += cost;
    },
    total: () => total,
  };
}

const message = (e: unknown) => {
  const text = (e instanceof Error ? e.message : String(e)).slice(0, 300);
  if (isCreditError(text)) outOfCredit = true;
  return text;
};
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const share = (xs: boolean[]) => ci(wilson(xs.filter(Boolean).length, xs.length));
const avg = (xs: number[], digits = 2) => (xs.length ? mean(xs).toFixed(digits) : "–");

// ---------------------------------------------------------------------------

interface Side<C> {
  run: (c: C, p: Persona, onUsage: UsageRecorder) => Promise<unknown>;
}

interface Spec<C extends { id: string; personaId: string }> {
  product: Side<C>["run"];
  baseline: Side<C>["run"];
  judge?: { rubric: RubricName; context: (c: C, p: Persona) => string; render: (out: never) => string };
  metrics: (rows: { c: C; p: Persona; product: unknown; baseline: unknown }[]) => Metric[] | Promise<Metric[]>;
  gate?: (report: FunctionReport, rows: { c: C; p: Persona; product: unknown; baseline: unknown }[]) => { rule: string; passed: boolean };
}

async function evaluate<C extends { id: string; personaId: string }>(fn: FunctionName, spec: Spec<C>, opts: RunOptions): Promise<FunctionReport> {
  const personas = new Map(load("personas").map((p) => [p.id, p]));
  const cases = sample(load(DATASET[fn]) as unknown as C[], casesFor(fn, opts), opts.seed);
  const costs = { product: meter(), baseline: meter(), judge: meter() };
  const errors: FunctionReport["errors"] = [];
  let skippedForBudget = 0;
  const reused = { product: 0, baseline: 0 };
  const previous = opts.reuse?.previous[fn];
  // Leave room for the calls already in flight, so the cap holds.
  const affordable = (next: number) => !outOfCredit && (opts.budget === undefined || spent + next * opts.concurrency <= opts.budget);

  const ran = await pool(cases, opts.concurrency, async (c) => {
    const p = personas.get(c.personaId)!;
    const hash = caseHash(c, p);
    const earlier = previous?.outputs.get(c.id);
    const same = earlier !== undefined && earlier.caseHash === hash;
    const keepProduct = same && opts.reuse!.product.includes(fn) && earlier.product != null;
    const keepBaseline = same && previous!.baselineSource === BASELINE_SOURCE && earlier.baseline != null;
    if (!(keepProduct && keepBaseline) && !affordable(COST_PER_CASE[fn])) {
      skippedForBudget += 1;
      return null;
    }
    const [prod, baseOut] = await Promise.all([
      keepProduct
        ? (reused.product++, earlier.product)
        : spec.product(c, p, costs.product.record).catch((e) => (errors.push({ side: "product", caseId: c.id, message: message(e) }), null)),
      keepBaseline
        ? (reused.baseline++, earlier.baseline)
        : spec.baseline(c, p, costs.baseline.record).catch((e) => (errors.push({ side: "baseline", caseId: c.id, message: message(e) }), null)),
    ]);
    return { c, p, hash, product: prod, baseline: baseOut };
  });
  const rows = ran.filter((r) => r !== null);
  const ok = rows.filter((r) => r.product !== null && r.baseline !== null);

  const pairs: PairRecord[] = [];
  if (spec.judge) {
    const judge = spec.judge;
    await pool(ok, opts.concurrency, async (r) => {
      const record: PairRecord = {
        fn,
        caseId: r.c.id,
        context: judge.context(r.c, r.p),
        product: judge.render(r.product as never),
        baseline: judge.render(r.baseline as never),
        result: null,
      };
      if (opts.judge && !affordable(0.07)) {
        skippedForBudget += 1;
      } else if (opts.judge) {
        record.result = await comparePair({ rubric: judge.rubric, context: record.context, product: record.product, baseline: record.baseline, onUsage: costs.judge.record }).catch(
          (e) => (errors.push({ side: "judge", caseId: r.c.id, message: message(e) }), null),
        );
      }
      pairs.push(record);
    });
  }

  const judged = pairs.filter((x) => x.result);
  const rate = judged.length ? winRate(judged.map((x) => x.result!.overall)) : null;
  const criteria: Record<string, WinRate> = {};
  for (const name of judged.length ? Object.keys(judged[0].result!.criteria) : []) {
    criteria[name] = winRate(judged.map((x) => x.result!.criteria[name] ?? "tie"));
  }

  const report: FunctionReport = {
    fn,
    cases: rows.length,
    skippedForBudget,
    reused,
    baselineSource: BASELINE_SOURCE,
    errors,
    cost: { product: costs.product.total(), baseline: costs.baseline.total(), judge: costs.judge.total() },
    metrics: await spec.metrics(ok),
    rate,
    criteria,
    gate: null,
    pairs,
    outputs: rows.map((r) => ({ caseId: r.c.id, caseHash: r.hash, product: r.product, baseline: r.baseline })),
  };
  report.gate = spec.gate ? spec.gate(report, ok) : rate ? { rule: "Wins at least 60% against the baseline, interval above 50%", passed: beatsBaseline(rate) } : null;
  return report;
}

// ---------------------------------------------------------------------------
// The functions

const renderPost = (o: { post: string; hashtags?: string[] }) => `${o.post}${o.hashtags?.length ? `\n\n${o.hashtags.join(" ")}` : ""}`;

function specs(): { [K in FunctionName]: () => Spec<never> } {
  return {
    extract: () =>
      ({
        product: product.pipelineExtract,
        baseline: base.baselineExtract,
        judge: {
          rubric: "extract",
          context: (c: import("./schema").NoteCase, p: Persona) => `${briefFor(p)}\n\nThe note:\n${c.text}`,
          render: (o: { wins: { summary: string; impact: string; metric: string | null; kind: string; confidential: boolean }[]; followUpQuestion?: string | null; follow_up_question?: string | null }) =>
            `${o.wins.map((w, i) => `${i + 1}. (${w.kind}${w.confidential ? ", confidential" : ""}) ${w.summary}${w.impact ? ` — ${w.impact}` : ""}${w.metric ? ` [${w.metric}]` : ""}`).join("\n") || "(no wins)"}\nFollow-up: ${o.followUpQuestion ?? o.follow_up_question ?? "none"}`,
        },
        metrics: (rows: { c: import("./schema").NoteCase; p: Persona; product: unknown; baseline: unknown }[]) => {
          const of = (side: "product" | "baseline") =>
            rows.map((r) => m.extractMetrics(r[side] as never, r.c.expect, r.c.text, r.p.rules.maskNames));
          const [a, b] = [of("product"), of("baseline")];
          const asked = (xs: m.ExtractMetrics[], helps: boolean) => xs.filter((_, i) => rows[i].c.expect.followUpHelps === helps).map((x) => x.asked);
          return [
            { label: "Win count within expected range", product: share(a.map((x) => x.countOk)), baseline: share(b.map((x) => x.countOk)) },
            { label: "Invented metrics per note", product: avg(a.map((x) => x.inventedMetrics)), baseline: avg(b.map((x) => x.inventedMetrics)) },
            { label: "Confidential flag correct", product: share(a.map((x) => x.confidentialOk)), baseline: share(b.map((x) => x.confidentialOk)) },
            { label: "Names leaked into stored text (per note)", product: avg(a.map((x) => x.nameLeaks)), baseline: avg(b.map((x) => x.nameLeaks)) },
            { label: "Asks a follow-up when it helps", product: share(asked(a, true)), baseline: share(asked(b, true)) },
            { label: "Holds back when it doesn't", product: share(asked(a, false).map((x) => !x)), baseline: share(asked(b, false).map((x) => !x)) },
          ];
        },
      }) as never,

    ideas: () =>
      ({
        product: product.pipelineIdeas,
        baseline: base.baselineIdeas,
        judge: {
          rubric: "ideas",
          context: (c: import("./schema").IdeaCase, p: Persona) => `${briefFor(p)}\n\nRecent wins:\n${winsText(c.wins)}`,
          render: (o: { ideas: { format: string; angle: string; hook: string; source_win_ids: string[] }[] }) =>
            o.ideas.map((i, n) => `${n + 1}. [${i.format}] ${i.hook}\n   ${i.angle} (uses ${i.source_win_ids.join(", ")})`).join("\n"),
        },
        metrics: (rows: { c: import("./schema").IdeaCase; p: Persona; product: unknown; baseline: unknown }[]) => {
          const of = (side: "product" | "baseline") =>
            rows.map((r) => m.ideaFlags((r[side] as { ideas: never[] }).ideas, r.c.wins.map((w) => w.id), r.p.rules));
          const [a, b] = [of("product"), of("baseline")];
          return [
            { label: "Ideas citing a missing or no win", product: avg(a.map((x) => x.badSources)), baseline: avg(b.map((x) => x.badSources)) },
            { label: "Distinct formats (of 3)", product: avg(a.map((x) => x.formats)), baseline: avg(b.map((x) => x.formats)) },
            { label: "Rule breaches in hooks and angles", product: avg(a.map((x) => x.breaches)), baseline: avg(b.map((x) => x.breaches)) },
          ];
        },
      }) as never,

    draft: () =>
      ({
        product: product.pipelineDraft,
        baseline: base.baselineDraft,
        judge: {
          rubric: "draft",
          context: (c: import("./schema").DraftCase, p: Persona) => `${briefFor(p)}\n\nThe idea (${c.format}): ${c.angle}\nSuggested first line: ${c.hook}\n\nFacts:\n${winsText(c.wins)}`,
          render: renderPost,
        },
        metrics: (rows: { c: import("./schema").DraftCase; p: Persona; product: unknown; baseline: unknown }[]) => {
          const of = (side: "product" | "baseline") =>
            rows.map((r) => {
              const o = r[side] as { post: string; hashtags: string[] };
              return m.draftMetrics(o.post, o.hashtags, r.p.rules, [winsText(r.c.wins), r.c.hook, r.c.angle]);
            });
          const [a, b] = [of("product"), of("baseline")];
          return [
            { label: "Posts with a rule breach", product: share(a.map((x) => x.breaches.length > 0)), baseline: share(b.map((x) => x.breaches.length > 0)) },
            { label: "Posts with an invented figure", product: share(a.map((x) => x.invented.length > 0)), baseline: share(b.map((x) => x.invented.length > 0)) },
            { label: "Length 120–220 words", product: share(a.map((x) => x.inRange)), baseline: share(b.map((x) => x.inRange)) },
            { label: "First line under 140 characters", product: share(a.map((x) => x.firstLineOk)), baseline: share(b.map((x) => x.firstLineOk)) },
            { label: "Cliché or AI-tell phrases per post", product: avg(a.map((x) => x.style)), baseline: avg(b.map((x) => x.style)) },
          ];
        },
      }) as never,

    check: () =>
      ({
        product: product.pipelineCheck,
        baseline: base.baselineCheck,
        metrics: (rows: { c: import("./schema").RiskCase; p: Persona; product: unknown; baseline: unknown }[]) => {
          const a = m.scoreSafety(rows.map((r) => ({ risks: r.c.risks, found: m.productFamilies((r.product as { report: never }).report, (r.product as { issues: never }).issues) })));
          const b = m.scoreSafety(rows.map((r) => ({ risks: r.c.risks, found: m.baselineFamilies((r.baseline as { problems: { category: RiskCategory }[] }).problems) })));
          const cats = [...new Set([...Object.keys(a.perCategory), ...Object.keys(b.perCategory)])].sort();
          return [
            { label: "Risky posts caught (at least one real risk)", product: ci(wilson(a.caughtAny, a.risky)), baseline: ci(wilson(b.caughtAny, b.risky)) },
            { label: "Risky posts fully caught (every risk)", product: ci(wilson(a.caughtAll, a.risky)), baseline: ci(wilson(b.caughtAll, b.risky)) },
            { label: "False alarms on clean posts (any flag)", product: ci(wilson(a.falseAlarms, a.clean)), baseline: ci(wilson(b.falseAlarms, b.clean)) },
            { label: "…that would stop or rewrite the post", product: ci(wilson(a.falseBlocks, a.clean)), baseline: ci(wilson(b.falseBlocks, b.clean)) },
            { label: "…notes only (grounding or credit)", product: ci(wilson(a.falseAlarms - a.falseBlocks, a.clean)), baseline: ci(wilson(b.falseAlarms - b.falseBlocks, b.clean)) },
            ...cats.map((cat) => ({
              label: `Caught: ${cat}`,
              product: ci(wilson(a.perCategory[cat]?.caught ?? 0, a.perCategory[cat]?.n ?? 0)),
              baseline: ci(wilson(b.perCategory[cat]?.caught ?? 0, b.perCategory[cat]?.n ?? 0)),
            })),
          ];
        },
        gate: (_report: FunctionReport, rows: { c: import("./schema").RiskCase; product: unknown }[]) => {
          const a = m.scoreSafety(rows.map((r) => ({ risks: r.c.risks, found: m.productFamilies((r.product as { report: never }).report, (r.product as { issues: never }).issues) })));
          const recall = a.risky ? a.caughtAll / a.risky : 0;
          const falseAlarm = a.clean ? a.falseAlarms / a.clean : 1;
          return { rule: "Catches every risk in at least 95% of risky posts, false alarms at most 20%", passed: recall >= 0.95 && falseAlarm <= 0.2 };
        },
      }) as never,

    reads: () =>
      ({
        product: product.pipelineReads,
        baseline: base.baselineReads,
        metrics: (rows: { c: import("./schema").ReadCase; product: unknown; baseline: unknown }[]) => {
          const right = (side: "product" | "baseline") => rows.map((r) => (r[side] as { verdict: string }).verdict === r.c.expected);
          const byVerdict = (v: string) => rows.map((r, i) => ({ r, i })).filter(({ r }) => r.c.expected === v);
          return [
            { label: "Verdict matches the label", product: share(right("product")), baseline: share(right("baseline")) },
            ...["confident", "boastful", "too_modest", "generic"].map((v) => ({
              label: `Correct on ${v}`,
              product: share(byVerdict(v).map(({ i }) => right("product")[i])),
              baseline: share(byVerdict(v).map(({ i }) => right("baseline")[i])),
            })),
          ];
        },
        gate: (_report: FunctionReport, rows: { c: import("./schema").ReadCase; product: unknown; baseline: unknown }[]) => {
          const p = rows.filter((r) => (r.product as { verdict: string }).verdict === r.c.expected).length;
          const b = rows.filter((r) => (r.baseline as { verdict: string }).verdict === r.c.expected).length;
          return { rule: "At least 80% correct and no worse than the baseline", passed: rows.length > 0 && p / rows.length >= 0.8 && p >= b };
        },
      }) as never,

    revision: () =>
      ({
        product: product.pipelineRevision,
        baseline: base.baselineRevision,
        judge: {
          rubric: "revision",
          context: (c: import("./schema").RevisionCase, p: Persona) => `${briefFor(p)}\n\nRequested revision: ${c.mode}\n\nOriginal post:\n${c.post}\n\nFacts:\n${winsText(c.facts)}`,
          render: (o: { post: string }) => o.post,
        },
        metrics: (rows: { c: import("./schema").RevisionCase; product: unknown; baseline: unknown }[]) => {
          const of = (side: "product" | "baseline") => rows.map((r) => m.revisionOk(r.c.mode, r.c.post, (r[side] as { post: string }).post, [winsText(r.c.facts)]));
          const [a, b] = [of("product"), of("baseline")];
          return [
            { label: "Did what was asked", product: share(a.map((x) => x.asked)), baseline: share(b.map((x) => x.asked)) },
            { label: "Revisions with an invented figure", product: share(a.map((x) => x.invented.length > 0)), baseline: share(b.map((x) => x.invented.length > 0)) },
          ];
        },
      }) as never,

    comments: () =>
      ({
        product: product.pipelineComments,
        baseline: base.baselineComments,
        judge: {
          rubric: "comments",
          context: (c: import("./schema").CommentCase, p: Persona) => `${briefFor(p)}\n\nPost by ${c.authorRole}:\n${c.post}`,
          render: (o: { options: { approach: string; starter: string; add: string }[] }) =>
            o.options.map((x, i) => `${i + 1}. ${x.approach}: ${x.starter}\n   Add: ${x.add}`).join("\n"),
        },
        metrics: (rows: { product: unknown; baseline: unknown }[]) => {
          const of = (side: "product" | "baseline") => rows.map((r) => m.commentFlags((r[side] as { options: never[] }).options));
          const [a, b] = [of("product"), of("baseline")];
          return [
            { label: "Starters with empty praise", product: avg(a.map((x) => x.praise)), baseline: avg(b.map((x) => x.praise)) },
            { label: "Starters over 50 words", product: avg(a.map((x) => x.tooLong)), baseline: avg(b.map((x) => x.tooLong)) },
          ];
        },
      }) as never,

    profile: () =>
      ({
        product: product.pipelineProfile,
        baseline: async (c: import("./schema").ProfileCase, p: Persona, onUsage: UsageRecorder) => {
          const o = await base.baselineProfile(c, p, onUsage);
          return {
            sections: [
              { section: "headline", text: o.headline.text, reason: o.headline.reason },
              { section: "about", text: o.about.text, reason: o.about.reason },
              { section: "experience", text: o.experience.bullets.map((b) => `• ${b}`).join("\n"), reason: o.experience.reason },
              { section: "cv", text: o.cv.bullets.map((b) => `• ${b}`).join("\n"), reason: o.cv.reason },
              { section: "skills", text: o.skills.items.join(", "), reason: o.skills.reason },
            ],
          };
        },
        judge: {
          rubric: "profile",
          context: (c: import("./schema").ProfileCase, p: Persona) =>
            `${briefFor(p)}\n\nWins this year:\n${winsText(c.wins)}\n\nCurrent headline: ${c.current.headline || "(none)"}\nCurrent About: ${c.current.about || "(none)"}\nCurrent role bullets: ${c.current.experience || "(none)"}`,
          render: (o: { sections: { section: string; text: string }[] }) => o.sections.map((s) => `## ${s.section}\n${s.text}`).join("\n\n"),
        },
        metrics: (rows: { c: import("./schema").ProfileCase; p: Persona; product: unknown; baseline: unknown }[]) => {
          const of = (side: "product" | "baseline") => rows.map((r) => m.profileFlags((r[side] as { sections: never[] }).sections, r.p.rules, [winsText(r.c.wins), r.c.current.about, r.c.current.experience]));
          const [a, b] = [of("product"), of("baseline")];
          return [
            { label: "Headline within 220 characters", product: share(a.map((x) => x.headlineOk)), baseline: share(b.map((x) => x.headlineOk)) },
            { label: "Rule breaches per profile", product: avg(a.map((x) => x.breaches)), baseline: avg(b.map((x) => x.breaches)) },
            { label: "Invented figures per profile", product: avg(a.map((x) => x.invented)), baseline: avg(b.map((x) => x.invented)) },
          ];
        },
      }) as never,

    voice: () =>
      ({
        product: product.pipelineVoice,
        baseline: base.baselineVoice,
        judge: {
          rubric: "voice",
          context: (c: import("./schema").VoiceCase, p: Persona) =>
            `Sample posts:\n${p.samplePosts.join("\n---\n")}\n\n${c.pairs.map((x, i) => `Pair ${i + 1}\nDrafted:\n${x.drafted}\nPosted:\n${x.posted}`).join("\n\n")}`,
          render: (o: { summary: string; notes: string[] }) => `${o.summary}\n${o.notes.map((n) => `- ${n}`).join("\n")}`,
        },
        metrics: async (rows: { c: import("./schema").VoiceCase; p: Persona; product: unknown; baseline: unknown }[]) => {
          const leaks = (side: "product" | "baseline") => rows.map((r) => m.voiceLeaks((r[side] as { notes: string[] }).notes, r.p.rules));
          const coverage = async (side: "product" | "baseline") =>
            Promise.all(rows.map((r) => traitCoverage({ traits: r.c.expectedTraits, notes: (r[side] as { notes: string[] }).notes }).catch(() => 0)));
          const [ca, cb] = await Promise.all([coverage("product"), coverage("baseline")]);
          return [
            { label: "Expected traits captured", product: pct(mean(ca)), baseline: pct(mean(cb)) },
            { label: "Notes recording content, names or figures", product: avg(leaks("product")), baseline: avg(leaks("baseline")) },
          ];
        },
      }) as never,
  };
}

export async function runAll(opts: RunOptions): Promise<FunctionReport[]> {
  const all = specs();
  const reports: FunctionReport[] = [];
  const ordered = opts.budget === undefined ? opts.functions : PRIORITY.filter((fn) => opts.functions.includes(fn));
  for (const fn of ordered) {
    reports.push(await evaluate(fn, all[fn]() as Spec<{ id: string; personaId: string }>, opts));
  }
  return reports;
}

export function estimateCost(opts: Pick<RunOptions, "functions" | "limit" | "limits">, sizes: Partial<Record<FunctionName, number>>): number {
  return opts.functions.reduce((sum, fn) => {
    const limit = casesFor(fn, opts);
    return sum + COST_PER_CASE[fn] * Math.min(limit > 0 ? limit : Infinity, sizes[fn] ?? 0);
  }, 0);
}

export function datasetFor(fn: FunctionName): DatasetName {
  return DATASET[fn];
}
