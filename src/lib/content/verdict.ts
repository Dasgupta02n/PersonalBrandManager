import type { GuardrailReport } from "@/lib/ai/tasks";
import { issueTier } from "@/lib/guardrails/check";
import { VERDICT_LABEL } from "./labels";

export type VerdictState = "ok" | "check" | "block" | "unknown";

export interface VerdictLine {
  key: "safety" | "reception" | "voice";
  state: VerdictState;
  label: string;
}

/**
 * Tier 1: confidentiality problems that block copying until fixed or acknowledged.
 * AI findings count only while unfixed: an automatic fix already removed them.
 */
export function blockingIssues(report: GuardrailReport | null): string[] {
  if (!report) return [];
  const instant = report.issues.filter((i) => issueTier(i.code) === 1).map((i) => i.message);
  if (report.revised) return instant;
  return [
    ...instant,
    ...report.confidentialityProblems.map((p) => `Confidentiality: ${p}`),
    ...report.noGoTopics.map((t) => `Touches a topic you never post about: ${t}.`),
  ];
}

/** Tier 2: worth a look, never blocking. */
export function checkNotes(report: GuardrailReport | null): string[] {
  if (!report) return [];
  const notes = report.issues.filter((i) => issueTier(i.code) === 2).map((i) => i.message);
  if (!report.revised) {
    if (report.jobSearchSignal && !notes.length) notes.push("Some wording could read as if you're looking for a new role.");
    notes.push(...report.unsupportedClaims.map((c) => `Not from your wins — check: ${c}`));
  }
  if (report.hierarchyRisk && !report.revised) notes.push(report.hierarchyRisk);
  return notes;
}

/** Tier 3: quiet style suggestions. */
export function styleSuggestions(report: GuardrailReport | null): string[] {
  return report?.issues.filter((i) => issueTier(i.code) === 3).map((i) => i.message) ?? [];
}

/** The four safety checks: confidentiality, facts, job-search signals, no-go topics. */
export function safetyChecks(report: GuardrailReport | null): { label: string; passed: boolean }[] {
  if (!report) return [];
  const fixed = report.revised;
  const instantConfidentiality = report.issues.some((i) => issueTier(i.code) === 1);
  return [
    { label: "Confidentiality", passed: !instantConfidentiality && (fixed || report.confidentialityProblems.length === 0) },
    { label: "Facts from your wins", passed: fixed || (report.grounded && report.unsupportedClaims.length === 0) },
    {
      label: "No job-hunting signals",
      passed: !report.issues.some((i) => i.code === "job_search") && (fixed || !report.jobSearchSignal),
    },
    { label: "No no-go topics", passed: fixed || report.noGoTopics.length === 0 },
  ];
}

/** The promise in three lines: is it safe, how will it land, does it sound like me. */
export function verdictLines(report: GuardrailReport | null): VerdictLine[] {
  if (!report) {
    return [{ key: "safety", state: "unknown", label: "Not checked yet" }];
  }
  const blocking = blockingIssues(report);
  const notes = checkNotes(report);
  const safety: VerdictLine = blocking.length
    ? { key: "safety", state: "block", label: blocking.length === 1 ? "1 thing to fix before posting" : `${blocking.length} things to fix before posting` }
    : notes.length
      ? { key: "safety", state: "check", label: notes.length === 1 ? "Safe to post · 1 thing to check" : `Safe to post · ${notes.length} things to check` }
      : { key: "safety", state: "ok", label: report.revised ? "Safe to post, after an automatic fix" : "Safe to post" };

  const reads = report.howItReads;
  const reception: VerdictLine = reads
    ? { key: "reception", state: reads.verdict === "confident" ? "ok" : "check", label: VERDICT_LABEL[reads.verdict] }
    : { key: "reception", state: "unknown", label: "Not yet read as others would" };

  const voice: VerdictLine =
    reads?.soundsLikeYou === true
      ? { key: "voice", state: "ok", label: "Sounds like you" }
      : reads?.soundsLikeYou === false
        ? { key: "voice", state: "check", label: "Doesn't sound like you yet" }
        : { key: "voice", state: "unknown", label: "Add sample posts to check your voice" };

  return [safety, reception, voice];
}
