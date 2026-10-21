import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText, Lock } from "lucide-react";
import { CopyButton, PrintButton } from "@/components/client";
import { RecordNav } from "@/components/record-nav";
import { Badge, EmptyState, PageHeader, buttonClass, cx } from "@/components/ui";
import { EXPORT_PERIODS, groupRecord, longDate, recordText, statsLine, type ExportPeriod, type RecordWin } from "@/lib/content/record";
import { requireUser } from "@/lib/data/session";
import { addDays, localParts } from "@/lib/schedule/time";

export const metadata: Metadata = { title: "Export your record" };

const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function ExportPage({ searchParams }: PageProps<"/wins/export">) {
  const { db, user, profile } = await requireUser();
  const params = await searchParams;
  const period: ExportPeriod = params.period === "half" || params.period === "year" ? params.period : "quarter";
  const includeConfidential = params.confidential !== "hide";

  const today = localParts(new Date(), profile.timezone).date;
  const from = addDays(today, -EXPORT_PERIODS[period].days + 1);

  const [wins, pillars, entries, posts, opportunities] = await Promise.all([
    db
      .from("wins")
      .select("occurred_on, summary, impact, metric, pillar_id, confidential, kind")
      .eq("user_id", user.id)
      .gte("occurred_on", from)
      .lte("occurred_on", today)
      .order("occurred_on", { ascending: false }),
    db.from("pillars").select("id, name").eq("user_id", user.id).order("position"),
    db.from("journal_entries").select("entry_date").eq("user_id", user.id).gte("entry_date", from),
    db
      .from("drafts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "posted")
      .gte("posted_at", `${from}T00:00:00Z`),
    db.from("opportunities").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("occurred_on", from),
  ]);

  const items = (wins.data ?? []) as RecordWin[];
  const { groups, praise } = groupRecord(items, pillars.data ?? [], { includeConfidential });
  const stats = {
    wins: groups.reduce((n, g) => n + g.wins.length, 0) + praise.length,
    workdaysLogged: new Set((entries.data ?? []).map((e) => e.entry_date)).size,
    postsPublished: posts.count ?? 0,
    praise: praise.length,
    opportunities: opportunities.count ?? 0,
  };
  const title = period === "year" ? "Your year in wins" : "Your record";
  const text = recordText({ title, from, to: today, stats, groups, praise });
  const hiddenCount = items.filter((w) => w.confidential).length;

  const link = (next: Partial<{ period: ExportPeriod; confidential: "hide" | "show" }>) => {
    const query = new URLSearchParams({
      period: next.period ?? period,
      ...((next.confidential ?? (includeConfidential ? "show" : "hide")) === "hide" ? { confidential: "hide" } : {}),
    });
    return `/wins/export?${query}`;
  };

  return (
    <>
      <RecordNav active="/wins/export" />
      <PageHeader
        title={title}
        description="For your appraisal, a promotion case or a catch-up with your manager. Built from what you logged; nothing added."
      />

      <div className="flex flex-col gap-3 print:hidden">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Period">
          {(Object.keys(EXPORT_PERIODS) as ExportPeriod[]).map((p) => (
            <Link
              key={p}
              href={link({ period: p })}
              aria-current={p === period ? "page" : undefined}
              className={cx(
                "flex min-h-11 items-center rounded-full border px-3.5 text-sm font-medium transition",
                p === period ? "border-ink bg-ink text-ink-foreground" : "border-border-strong hover:bg-surface",
              )}
            >
              {EXPORT_PERIODS[p].label}
            </Link>
          ))}
        </div>
        {hiddenCount > 0 && (
          <Link href={link({ confidential: includeConfidential ? "hide" : "show" })} className="link self-start text-sm">
            {includeConfidential
              ? `Leave out ${hiddenCount} confidential ${hiddenCount === 1 ? "win" : "wins"} (for sharing outside work)`
              : "Include confidential wins again"}
          </Link>
        )}
      </div>

      {stats.wins === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nothing logged in this period yet"
          action={
            <Link href="/today" className={buttonClass("primary", undefined, "sm")}>
              Log today&apos;s first win
            </Link>
          }
        >
          A line a day adds up. By your next review, this page writes itself.
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 print:hidden">
            <CopyButton text={text} label="Copy for your appraisal" size="sm" variant="primary" />
            <a
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`}
              download={`${period === "year" ? "year-in-wins" : "record"}-${today}.txt`}
              className={buttonClass("secondary", undefined, "sm")}
            >
              <Download aria-hidden />
              Download as text
            </a>
            <PrintButton size="sm" />
          </div>

          <article className="flex flex-col gap-6 rounded-xl border border-border p-4 sm:p-6 print:border-0 print:p-0">
            <header>
              <p className="text-[13px] font-medium text-muted">
                {longDate(from)} – {longDate(today)}
              </p>
              <h2 className="mt-1 font-display text-display-m font-medium">{profile.full_name ?? title}</h2>
              <p className="mt-2 text-sm text-brass">{statsLine(stats)}</p>
            </header>
            {groups.map((group) => (
              <section key={group.title} className="flex flex-col gap-2">
                <h3 className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">{group.title}</h3>
                <ul className="flex flex-col gap-3">
                  {group.wins.map((w, i) => (
                    <li key={`${w.occurred_on}-${i}`} className="flex gap-3">
                      <span className="w-14 shrink-0 pt-0.5 text-[13px] text-muted tabular-nums">{shortDate(w.occurred_on)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] leading-relaxed">
                          {w.summary}
                          {w.metric && <span className="text-muted"> ({w.metric})</span>}
                        </p>
                        {w.impact && <p className="text-sm leading-relaxed text-muted">{w.impact}</p>}
                        {w.confidential && (
                          <span className="mt-1 inline-block print:hidden">
                            <Badge icon={Lock}>Confidential</Badge>
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {praise.length > 0 && (
              <section className="flex flex-col gap-2">
                <h3 className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">What others said</h3>
                <ul className="flex flex-col gap-3">
                  {praise.map((w, i) => (
                    <li key={`${w.occurred_on}-${i}`} className="flex gap-3">
                      <span className="w-14 shrink-0 pt-0.5 text-[13px] text-muted tabular-nums">{shortDate(w.occurred_on)}</span>
                      <p className="min-w-0 flex-1 text-[15px] leading-relaxed text-brass">{w.summary}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>
        </>
      )}
    </>
  );
}
