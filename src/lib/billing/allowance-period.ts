import { AI_ALLOWANCE_USD, TRIAL_DAYS, type PlanKind } from "./pricing";

export interface AllowanceStatus {
  plan: PlanKind;
  limitUsd: number;
  spentUsd: number;
  /** Share of the allowance used, 0 to 1. */
  used: number;
  periodStart: Date;
  /** When the allowance renews; null when a trial has ended and nothing renews. */
  renewsOn: Date | null;
  /** True once a trial's month is over. */
  ended: boolean;
}

/**
 * The window an allowance covers. A trial covers its first TRIAL_DAYS days, once; members and
 * beta users get a fresh allowance each calendar month (UTC) until billing sets real periods.
 */
export function allowancePeriod(plan: PlanKind, startedAt: Date, now: Date): { start: Date; end: Date } {
  if (plan === "trial") {
    return { start: startedAt, end: new Date(startedAt.getTime() + TRIAL_DAYS * 86_400_000) };
  }
  return {
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  };
}

export function allowanceStatus(plan: PlanKind, startedAt: Date, spentUsd: number, now: Date = new Date()): AllowanceStatus {
  const { start, end } = allowancePeriod(plan, startedAt, now);
  const limitUsd = AI_ALLOWANCE_USD[plan];
  const ended = plan === "trial" && now >= end;
  return {
    plan,
    limitUsd,
    spentUsd,
    used: ended ? 1 : Math.min(spentUsd / limitUsd, 1),
    periodStart: start,
    renewsOn: plan === "trial" ? null : end,
    ended,
  };
}

export function isExhausted(status: AllowanceStatus): boolean {
  return status.ended || status.spentUsd >= status.limitUsd;
}

/** Shown from this share onwards, so most people never see a meter at all. */
export const NEAR_LIMIT = 0.8;

const formatDate = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });

/** Plain words for an exhausted allowance. Notes are always saved, so the record never has gaps. */
export function exhaustedMessage(status: Pick<AllowanceStatus, "plan" | "renewsOn" | "ended">): string {
  if (status.plan === "trial") {
    return status.ended
      ? "Your trial month has ended. Your record is still here; become a member to keep turning it into posts."
      : "You've used this trial's allowance. Your notes are still saved; become a member to keep turning them into wins and posts.";
  }
  const renews = status.renewsOn ? ` It renews on ${formatDate(status.renewsOn)}.` : "";
  return `You've reached this month's fair-use allowance. Your notes are still saved.${renews}`;
}

export function nearLimitMessage(status: AllowanceStatus): string {
  if (status.plan === "trial") return "You've used most of this trial's allowance.";
  return `You've used most of this month's allowance.${status.renewsOn ? ` It renews on ${formatDate(status.renewsOn)}.` : ""}`;
}
