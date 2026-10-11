import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Trash2, Trophy } from "lucide-react";
import { CopyButton } from "@/components/client";
import { Badge, EmptyState, PageHeader, buttonClass, cx } from "@/components/ui";
import { WIN_KIND_LABEL } from "@/lib/content/labels";
import { requireUser } from "@/lib/data/session";
import { WIN_KINDS, type WinKind } from "@/lib/domain/types";
import { localParts } from "@/lib/schedule/time";
import { deleteWin } from "./actions";

export const metadata: Metadata = { title: "Wins" };

interface WinItem {
  id: string;
  occurred_on: string;
  summary: string;
  impact: string;
  metric: string | null;
  pillar_id: string | null;
  confidential: boolean;
  kind: WinKind;
}

const formatDay = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const formatMonth = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

export default async function WinsPage({ searchParams }: PageProps<"/wins">) {
  const { supabase, user, profile } = await requireUser();
  const requested = (await searchParams).kind;
  const kind = WIN_KINDS.includes(requested as WinKind) ? (requested as WinKind) : null;

  let query = supabase
    .from("wins")
    .select("id, occurred_on, summary, impact, metric, pillar_id, confidential, kind")
    .eq("user_id", user.id)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);
  if (kind) query = query.eq("kind", kind);

  const today = localParts(new Date(), profile.timezone).date;
  const [wins, pillars, monthCount] = await Promise.all([
    query,
    supabase.from("pillars").select("id, name").eq("user_id", user.id),
    supabase
      .from("wins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("occurred_on", `${today.slice(0, 8)}01`),
  ]);

  const items = (wins.data ?? []) as WinItem[];
  const pillarName = new Map((pillars.data ?? []).map((p) => [p.id, p.name]));
  const byMonth = new Map<string, WinItem[]>();
  for (const win of items) {
    const key = win.occurred_on.slice(0, 7);
    byMonth.set(key, [...(byMonth.get(key) ?? []), win]);
  }
  const asList = items
    .map((w) => `• ${formatDay(w.occurred_on)}: ${w.summary}${w.metric ? ` (${w.metric})` : ""}`)
    .join("\n");

  return (
    <>
      <PageHeader
        title="Your record"
        description="Everything you've logged, in your own words. Posts, your profile and your CV are built only from this."
        action={
          (monthCount.count ?? 0) > 0 ? (
            <p className="text-sm font-medium text-brass">
              {monthCount.count} this month
            </p>
          ) : undefined
        }
      />

      <nav aria-label="Filter by type" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {[null, ...WIN_KINDS].map((k) => {
          const active = k === kind;
          return (
            <Link
              key={k ?? "all"}
              href={k ? `/wins?kind=${k}` : "/wins"}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex min-h-11 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium transition",
                active ? "border-ink bg-ink text-ink-foreground" : "border-border-strong hover:bg-surface",
              )}
            >
              {k ? WIN_KIND_LABEL[k] : "All"}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={kind ? `No ${WIN_KIND_LABEL[kind].toLowerCase()} wins yet` : "Your record builds here"}
          action={
            <Link href="/today" className={buttonClass("primary", undefined, "sm")}>
              Log today&apos;s first win
            </Link>
          }
        >
          One line a day is enough. Every post is built only from what you log.
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {items.length} {items.length === 1 ? "win" : "wins"}
              {kind ? ` · ${WIN_KIND_LABEL[kind]}` : ""}
            </p>
            <CopyButton text={asList} label="Copy as a list" size="sm" variant="ghost" />
          </div>
          {[...byMonth.entries()].map(([month, monthItems]) => (
            <section key={month} className="flex flex-col gap-1">
              <h2 className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">{formatMonth(`${month}-01`)}</h2>
              <ul className="flex flex-col divide-y divide-border border-y border-border">
                {monthItems.map((win) => (
                  <li key={win.id} className="flex gap-3 py-3.5">
                    <p className="w-14 shrink-0 pt-0.5 text-[13px] text-muted tabular-nums">{formatDay(win.occurred_on).replace(/^\w+ /, "")}</p>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <p className="text-[15px] leading-relaxed">{win.summary}</p>
                      {win.impact && <p className="text-sm leading-relaxed text-muted">{win.impact}</p>}
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={win.kind === "praise" ? "brass" : "neutral"}>{WIN_KIND_LABEL[win.kind]}</Badge>
                        {win.metric && <Badge>{win.metric}</Badge>}
                        {win.pillar_id && pillarName.get(win.pillar_id) && <Badge>{pillarName.get(win.pillar_id)}</Badge>}
                        {win.confidential && <Badge icon={Lock}>Confidential</Badge>}
                      </div>
                    </div>
                    <form action={deleteWin}>
                      <input type="hidden" name="winId" value={win.id} />
                      <button
                        type="submit"
                        aria-label={`Delete win: ${win.summary}`}
                        title="Delete"
                        className="-mr-2 flex size-11 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 aria-hidden className="size-[18px]" />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </>
  );
}
