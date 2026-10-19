import type { Metadata } from "next";
import Link from "next/link";
import { Lightbulb, Lock, X } from "lucide-react";
import { SubmitButton } from "@/components/client";
import { Badge, EmptyState, Notice, Panel, SectionHeader, cx } from "@/components/ui";
import { loadAllowance } from "@/lib/billing/allowance";
import { NEAR_LIMIT, exhaustedMessage, isExhausted, nearLimitMessage } from "@/lib/billing/allowance-period";
import { loadUserContext } from "@/lib/data/context";
import { FORMAT_LABEL, WIN_KIND_LABEL } from "@/lib/content/labels";
import { requireUser } from "@/lib/data/session";
import type { PostFormat, WinKind } from "@/lib/domain/types";
import { addDays, localParts, workdayConsistency, workdaysMissed } from "@/lib/schedule/time";
import { dismissIdea, skipFollowUp } from "./actions";
import { CaptureForm, FollowUpForm, MoreIdeasButton, WriteDraftButton } from "./forms";

export const metadata: Metadata = { title: "Today" };

function greeting(minutes: number) {
  const hour = Math.floor(minutes / 60);
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function TodayPage() {
  const { supabase, user, profile } = await requireUser();
  const now = localParts(new Date(), profile.timezone);
  const today = now.date;
  const monthStart = `${today.slice(0, 8)}01`;

  const [entries, todaysWins, monthWins, ideas, recentWins, allowance, ctx] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id, entry_date, follow_up_question, created_at")
      .eq("user_id", user.id)
      .gte("entry_date", addDays(today, -60))
      .order("created_at", { ascending: false }),
    supabase
      .from("wins")
      .select("id, summary, metric, confidential, kind")
      .eq("user_id", user.id)
      .eq("occurred_on", today)
      .order("created_at", { ascending: false }),
    supabase.from("wins").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("occurred_on", monthStart),
    supabase
      .from("drafts")
      .select("id, angle, hook, post_format")
      .eq("user_id", user.id)
      .eq("kind", "post_idea")
      .eq("status", "idea")
      .order("created_at", { ascending: true })
      .limit(3),
    supabase.from("wins").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("occurred_on", addDays(today, -30)),
    loadAllowance(user.id),
    loadUserContext(supabase, user.id),
  ]);

  const entryRows = entries.data ?? [];
  const entryDates = entryRows.map((e) => e.entry_date);
  const consistency = workdayConsistency(entryDates, today);
  const missed = workdaysMissed(entryDates, today);
  const followUp = entryRows.find((e) => e.entry_date === today && e.follow_up_question);
  const firstName = profile.full_name?.split(" ")[0];
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: profile.timezone,
  });
  const winsThisMonth = monthWins.count ?? 0;
  const ideaRows = ideas.data ?? [];
  const hasRecentWins = (recentWins.count ?? 0) > 0;

  return (
    <>
      <header>
        <p className="text-[13px] font-medium text-muted">{dateLabel}</p>
        <h1 className="mt-0.5 font-display text-display-m font-medium">
          {greeting(now.minutes)}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        {(consistency.logged > 0 || winsThisMonth > 0) && (
          // A zero count is left out: after a gap the comeback prompt speaks, not a score.
          <p className="mt-1.5 text-sm text-muted">
            {consistency.logged > 0 && `${consistency.logged} of the last ${consistency.window} workdays`}
            {consistency.logged > 0 && winsThisMonth > 0 && " · "}
            {winsThisMonth > 0 && (
              <span className="font-medium text-brass">
                {winsThisMonth} {winsThisMonth === 1 ? "win" : "wins"} this month
              </span>
            )}
          </p>
        )}
      </header>

      {allowance && allowance.used >= NEAR_LIMIT && (
        <Notice tone="neutral">
          {isExhausted(allowance) ? exhaustedMessage(allowance) : nearLimitMessage(allowance)}{" "}
          <Link href="/account" className="link font-semibold">
            Your plan
          </Link>
        </Notice>
      )}

      <Panel>
        <CaptureForm prompt="What moved forward today?" comeback={missed !== null && missed >= 3} masksNames={ctx.rules.maskNames} />
      </Panel>

      {followUp?.follow_up_question && (
        <Panel tone="outline" className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">One question</p>
            <form action={skipFollowUp}>
              <input type="hidden" name="entryId" value={followUp.id} />
              <SubmitButton variant="ghost" size="sm" className="-mt-2 -mr-2" pendingLabel="Skipping…">
                Skip
              </SubmitButton>
            </form>
          </div>
          <FollowUpForm entryId={followUp.id} question={followUp.follow_up_question} />
        </Panel>
      )}

      {(todaysWins.data?.length ?? 0) > 0 && (
        <section className="flex flex-col gap-1">
          <SectionHeader title="Today's wins" count={todaysWins.data?.length} />
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {todaysWins.data?.map((win) => (
              <li key={win.id} className="flex flex-col gap-1.5 py-3">
                <p className="text-[15px] leading-relaxed">{win.summary}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge>{WIN_KIND_LABEL[win.kind as WinKind]}</Badge>
                  {win.metric && <Badge>{win.metric}</Badge>}
                  {win.confidential && <Badge icon={Lock}>Confidential</Badge>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <SectionHeader
          title={ideaRows.length ? `${ideaRows.length} ways to share this` : "Ways to share your work"}
          action={ideaRows.length > 0 ? <MoreIdeasButton /> : undefined}
        />
        {ideaRows.length ? (
          <div className="flex flex-col gap-3">
            {ideaRows.map((idea, i) => {
              const suggested = i === 0;
              return (
                <Panel key={idea.id} tone={suggested ? "inset" : "outline"} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-[13px] font-medium text-muted">
                      {FORMAT_LABEL[(idea.post_format ?? "lesson") as PostFormat]}
                      {suggested && <Badge tone="neutral">Suggested</Badge>}
                    </p>
                    <form action={dismissIdea}>
                      <input type="hidden" name="ideaId" value={idea.id} />
                      <button
                        type="submit"
                        aria-label="Not this one"
                        title="Not this one"
                        className="-m-2 flex size-11 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
                      >
                        <X aria-hidden className="size-[18px]" />
                      </button>
                    </form>
                  </div>
                  <p className={cx("font-semibold text-balance", suggested ? "text-xl leading-7" : "text-base")}>{idea.hook}</p>
                  {suggested && <p className="max-w-[65ch] text-[15px] leading-relaxed text-muted">{idea.angle}</p>}
                  <div className="flex">
                    <WriteDraftButton ideaId={idea.id} prominent={suggested} />
                  </div>
                </Panel>
              );
            })}
          </div>
        ) : hasRecentWins ? (
          <EmptyState icon={Lightbulb} title="No ideas waiting" action={<MoreIdeasButton label="Find ideas from my recent wins" primary />}>
            Ideas come only from wins you logged in the last 30 days.
          </EmptyState>
        ) : (
          <EmptyState icon={Lightbulb} title="Your first ideas appear here">
            Write a line above about something that moved forward. You&apos;ll get three ways to share it.
          </EmptyState>
        )}
      </section>

      <p className="text-sm text-muted">
        Did something come to you — a headhunter, an invitation, a client lead?{" "}
        <Link href="/wins/week#log" className="link font-medium">
          Log it
        </Link>
      </p>
    </>
  );
}
