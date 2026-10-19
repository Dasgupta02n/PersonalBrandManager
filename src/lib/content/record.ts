import type { WinKind } from "@/lib/domain/types";
import { addDays, isWorkday, weekStart } from "@/lib/schedule/time";

// Turning the record into things that matter in weeks without a post: an appraisal summary,
// a year in wins, and a weekly scorecard. Plain code, no AI, so they cost nothing to produce.

export interface RecordWin {
  occurred_on: string;
  summary: string;
  impact: string;
  metric: string | null;
  pillar_id: string | null;
  confidential: boolean;
  kind: WinKind;
}

export const EXPORT_PERIODS = {
  quarter: { label: "Last 3 months", days: 91 },
  half: { label: "Last 6 months", days: 182 },
  year: { label: "Last 12 months", days: 365 },
} as const;
export type ExportPeriod = keyof typeof EXPORT_PERIODS;

/** Order inside each topic: outcomes first, then the judgement behind them. */
const KIND_ORDER: WinKind[] = ["result", "decision", "unblocked", "helped", "lesson"];

export interface RecordGroup {
  title: string;
  wins: RecordWin[];
}

/** Wins grouped by topic (in the user's topic order, then "Other work"); praise is kept apart. */
export function groupRecord(
  wins: RecordWin[],
  pillars: { id: string; name: string }[],
  options: { includeConfidential: boolean },
): { groups: RecordGroup[]; praise: RecordWin[] } {
  const kept = wins.filter((w) => options.includeConfidential || !w.confidential);
  const byKind = (a: RecordWin, b: RecordWin) =>
    KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || b.occurred_on.localeCompare(a.occurred_on);

  const work = kept.filter((w) => w.kind !== "praise");
  const known = new Set(pillars.map((p) => p.id));
  const groups: RecordGroup[] = pillars
    .map((p) => ({ title: p.name, wins: work.filter((w) => w.pillar_id === p.id).sort(byKind) }))
    .filter((g) => g.wins.length > 0);
  const other = work.filter((w) => !w.pillar_id || !known.has(w.pillar_id)).sort(byKind);
  if (other.length) groups.push({ title: groups.length ? "Other work" : "Your work", wins: other });

  const praise = kept.filter((w) => w.kind === "praise").sort((a, b) => b.occurred_on.localeCompare(a.occurred_on));
  return { groups, praise };
}

export interface RecordStats {
  wins: number;
  workdaysLogged: number;
  postsPublished: number;
  praise: number;
  opportunities: number;
}

const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
export const longDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function statsLine(stats: RecordStats): string {
  return [
    plural(stats.wins, "win"),
    plural(stats.workdaysLogged, "workday logged", "workdays logged"),
    plural(stats.postsPublished, "post published", "posts published"),
    plural(stats.praise, "piece of praise", "pieces of praise"),
    plural(stats.opportunities, "opportunity", "opportunities"),
  ].join(" · ");
}

/** Plain text that pastes cleanly into an appraisal form, an email or a document. */
export function recordText(input: {
  title: string;
  from: string;
  to: string;
  stats: RecordStats;
  groups: RecordGroup[];
  praise: RecordWin[];
}): string {
  const lines = [`${input.title}: ${longDate(input.from)} – ${longDate(input.to)}`, statsLine(input.stats), ""];
  for (const group of input.groups) {
    lines.push(group.title);
    for (const win of group.wins) {
      lines.push(`- ${shortDate(win.occurred_on)}: ${win.summary}${win.metric ? ` (${win.metric})` : ""}`);
      if (win.impact) lines.push(`  Why it mattered: ${win.impact}`);
    }
    lines.push("");
  }
  if (input.praise.length) {
    lines.push("What others said");
    for (const win of input.praise) lines.push(`- ${shortDate(win.occurred_on)}: ${win.summary}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

// ---------------------------------------------------------------------------
// Weekly scorecard
// ---------------------------------------------------------------------------

export interface WeekRow {
  start: string;
  opportunities: number;
  workdaysLogged: number;
  workdays: number;
  wins: number;
  posts: number;
  praise: number;
}

/** The current week and the ones before it, Monday to Sunday, newest first. */
export function weekRows(
  today: string,
  weeks: number,
  data: { entryDates: string[]; wins: { occurred_on: string; kind: WinKind }[]; postDates: string[]; opportunityDates: string[] },
): WeekRow[] {
  const current = weekStart(today);
  const entryDays = new Set(data.entryDates);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(current, -7 * i);
    const end = addDays(start, 6);
    const inWeek = (date: string) => date >= start && date <= end;
    const days = Array.from({ length: 7 }, (_, d) => addDays(start, d)).filter((d) => d <= today);
    return {
      start,
      opportunities: data.opportunityDates.filter(inWeek).length,
      workdaysLogged: days.filter((d) => entryDays.has(d)).length,
      workdays: days.filter(isWorkday).length,
      wins: data.wins.filter((w) => inWeek(w.occurred_on)).length,
      posts: data.postDates.filter(inWeek).length,
      praise: data.wins.filter((w) => w.kind === "praise" && inWeek(w.occurred_on)).length,
    };
  });
}

/** One calm suggestion for next week. Never a score, never guilt. */
export function nextWeekSuggestion(week: WeekRow, readyDrafts: number, routineCue: string | null): string {
  if (readyDrafts > 0) {
    return `You have ${plural(readyDrafts, "draft")} ready. Posting one when it feels right keeps your work visible.`;
  }
  if (week.wins > 0 && week.posts === 0) return "Turn one of this week's wins into a post. The best one is already marked Suggested on Today.";
  if (week.workdaysLogged < 3) {
    return routineCue
      ? `Try a short note on three workdays next week, after you ${routineCue}.`
      : "Try a short note on three workdays next week. A line is enough.";
  }
  return "Keep the rhythm: a note most workdays, a post when one is worth sharing.";
}
