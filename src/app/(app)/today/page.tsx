import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/client";
import { Badge, Card, EmptyState, Notice, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/data/session";
import { addDays, dailyStreak, localParts } from "@/lib/schedule/time";
import { dismissIdea } from "./actions";
import { LogEntryForm, WriteDraftForm } from "./forms";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const { supabase, user, profile } = await requireUser();
  const today = localParts(new Date(), profile.timezone).date;

  const [entries, todaysWins, ideas] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("entry_date, follow_up_question, created_at")
      .eq("user_id", user.id)
      .gte("entry_date", addDays(today, -60))
      .order("created_at", { ascending: false }),
    supabase
      .from("wins")
      .select("id, summary, metric, confidential")
      .eq("user_id", user.id)
      .eq("occurred_on", today)
      .order("created_at", { ascending: false }),
    supabase
      .from("drafts")
      .select("id, angle, hook")
      .eq("user_id", user.id)
      .eq("kind", "post_idea")
      .eq("status", "idea")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const entryRows = entries.data ?? [];
  const streak = dailyStreak(
    entryRows.map((e) => e.entry_date),
    today,
  );
  const followUp = entryRows.find((e) => e.entry_date === today && e.follow_up_question)?.follow_up_question;
  const firstName = profile.full_name?.split(" ")[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Hi ${firstName}` : "Today"}
        description="Log what you did. Ideas and drafts are built from your real work."
        action={
          <Badge tone={streak > 0 ? "success" : "neutral"}>
            {streak > 0 ? `${streak}-day streak` : "Start your streak today"}
          </Badge>
        }
      />

      <Card>
        <LogEntryForm prompt="What did you get done today?" />
      </Card>

      {followUp && (
        <Notice tone="accent">
          <strong>Quick question:</strong> {followUp} Add your answer as another entry above.
        </Notice>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Today&apos;s wins</h2>
        {todaysWins.data?.length ? (
          <ul className="flex flex-col gap-2">
            {todaysWins.data.map((win) => (
              <li key={win.id} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                {win.summary}
                <span className="ml-2 inline-flex gap-1 align-middle">
                  {win.metric && <Badge tone="accent">{win.metric}</Badge>}
                  {win.confidential && <Badge tone="warning">Confidential</Badge>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No wins logged yet today.</EmptyState>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Post ideas</h2>
          <Link href="/drafts" className="text-sm font-semibold text-accent">
            All drafts
          </Link>
        </div>
        {ideas.data?.length ? (
          ideas.data.map((idea) => (
            <Card key={idea.id} className="flex flex-col gap-3">
              <p className="font-semibold">{idea.hook}</p>
              <p className="text-sm text-muted">{idea.angle}</p>
              <div className="flex flex-wrap items-start gap-2">
                <WriteDraftForm ideaId={idea.id} />
                <form action={dismissIdea}>
                  <input type="hidden" name="ideaId" value={idea.id} />
                  <SubmitButton variant="ghost" pendingLabel="Dismissing…">
                    Not this one
                  </SubmitButton>
                </form>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState>Log a win and your first post ideas will appear here.</EmptyState>
        )}
      </section>
    </>
  );
}
