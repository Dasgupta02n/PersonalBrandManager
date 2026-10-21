import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { RecordNav } from "@/components/record-nav";
import { PageHeader, Panel, SectionHeader } from "@/components/ui";
import { OPPORTUNITY_LABEL } from "@/lib/content/labels";
import { nextWeekSuggestion, weekRows } from "@/lib/content/record";
import type { WinKind } from "@/lib/domain/types";
import { requireUser } from "@/lib/data/session";
import { addDays, localParts, weekStart } from "@/lib/schedule/time";
import { deleteOpportunity } from "./actions";
import { OpportunityForm } from "./opportunity-form";

export const metadata: Metadata = { title: "This week" };

const WEEKS = 4;

const dayLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function WeekPage() {
  const { db, user, profile } = await requireUser();
  const today = localParts(new Date(), profile.timezone).date;
  const since = addDays(weekStart(today), -7 * (WEEKS - 1));

  const [entries, wins, posts, opportunities, ready] = await Promise.all([
    db.from("journal_entries").select("entry_date").eq("user_id", user.id).gte("entry_date", since),
    db.from("wins").select("occurred_on, kind").eq("user_id", user.id).gte("occurred_on", since),
    db.from("drafts").select("posted_at").eq("user_id", user.id).eq("status", "posted").gte("posted_at", `${since}T00:00:00Z`),
    db
      .from("opportunities")
      .select("id, kind, description, occurred_on")
      .eq("user_id", user.id)
      .gte("occurred_on", addDays(today, -90))
      .order("occurred_on", { ascending: false }),
    db.from("drafts").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("kind", "post").eq("status", "ready"),
  ]);

  const opportunityRows = opportunities.data ?? [];
  const rows = weekRows(today, WEEKS, {
    entryDates: (entries.data ?? []).map((e) => e.entry_date),
    wins: (wins.data ?? []) as { occurred_on: string; kind: WinKind }[],
    postDates: (posts.data ?? []).map((p) => localParts(new Date(p.posted_at as string), profile.timezone).date),
    opportunityDates: opportunityRows.map((o) => o.occurred_on),
  });
  const [week] = rows;

  const tiles = [
    { label: "Opportunities that came to you", value: week.opportunities, brass: week.opportunities > 0 },
    { label: "Workdays logged", value: `${week.workdaysLogged} of ${week.workdays}` },
    { label: "Wins logged", value: week.wins, brass: week.wins > 0 },
    { label: "Posts published", value: week.posts },
  ];

  return (
    <>
      <RecordNav active="/wins/week" />
      <PageHeader eyebrow={`Week of ${dayLabel(week.start)}`} title="This week" />

      <dl className="grid grid-cols-2 gap-3">
        {tiles.map((tile, i) => (
          <Panel key={tile.label} className={i === 0 ? "col-span-2" : undefined}>
            <dt className="text-[13px] font-medium text-muted">{tile.label}</dt>
            <dd className={`mt-1 font-display text-display-m font-medium tabular-nums ${tile.brass ? "text-brass" : ""}`}>{tile.value}</dd>
          </Panel>
        ))}
      </dl>

      <Panel tone="outline">
        <p className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Next week</p>
        <p className="mt-1.5 text-[15px] leading-relaxed">{nextWeekSuggestion(week, ready.count ?? 0, profile.routine_cue)}</p>
      </Panel>

      <section className="flex flex-col gap-1">
        <SectionHeader title="The last four weeks" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] text-left text-sm tabular-nums">
            <thead className="text-muted">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-medium">Week of</th>
                <th className="py-2 pr-3 font-medium">Came to you</th>
                <th className="py-2 pr-3 font-medium">Logged</th>
                <th className="py-2 pr-3 font-medium">Wins</th>
                <th className="py-2 font-medium">Posts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.start} className="border-b border-border">
                  <td className="py-2.5 pr-3">{dayLabel(row.start)}</td>
                  <td className="py-2.5 pr-3">{row.opportunities}</td>
                  <td className="py-2.5 pr-3">
                    {row.workdaysLogged} of {row.workdays}
                  </td>
                  <td className="py-2.5 pr-3">{row.wins}</td>
                  <td className="py-2.5">{row.posts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="log" className="flex scroll-mt-20 flex-col gap-3">
        <SectionHeader title="Log an opportunity" />
        <p className="-mt-2 text-sm leading-relaxed text-muted">
          A headhunter&apos;s call, an invitation, a client who found you. This is the outcome that matters, so it comes first.
          Private to you.
        </p>
        <Panel>
          <OpportunityForm today={today} />
        </Panel>
        {opportunityRows.length > 0 && (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {opportunityRows.map((o) => (
              <li key={o.id} className="flex items-start gap-3 py-3">
                <p className="w-14 shrink-0 pt-0.5 text-[13px] text-muted tabular-nums">{dayLabel(o.occurred_on)}</p>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-relaxed">{o.description}</p>
                  <p className="text-sm text-muted">{OPPORTUNITY_LABEL[o.kind as keyof typeof OPPORTUNITY_LABEL]}</p>
                </div>
                <form action={deleteOpportunity}>
                  <input type="hidden" name="id" value={o.id} />
                  <button
                    type="submit"
                    aria-label={`Delete: ${o.description}`}
                    title="Delete"
                    className="-mr-2 flex size-11 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 aria-hidden className="size-[18px]" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
