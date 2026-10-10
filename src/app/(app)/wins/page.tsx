import type { Metadata } from "next";
import { SubmitButton } from "@/components/client";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/data/session";
import { deleteWin } from "./actions";

export const metadata: Metadata = { title: "Wins" };

export default async function WinsPage() {
  const { supabase, user } = await requireUser();
  const [wins, pillars] = await Promise.all([
    supabase
      .from("wins")
      .select("id, occurred_on, summary, impact, metric, skills, pillar_id, confidential")
      .eq("user_id", user.id)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("pillars").select("id, name").eq("user_id", user.id),
  ]);

  const pillarName = new Map((pillars.data ?? []).map((p) => [p.id, p.name]));
  const byDate = new Map<string, NonNullable<typeof wins.data>>();
  for (const win of wins.data ?? []) {
    const list = byDate.get(win.occurred_on) ?? [];
    list.push(win);
    byDate.set(win.occurred_on, list);
  }

  return (
    <>
      <PageHeader
        title="Your wins"
        description="Everything you've logged, in your own words. Posts, your profile and your CV are built only from these."
      />
      {byDate.size === 0 ? (
        <EmptyState>Your wins will collect here as you log them.</EmptyState>
      ) : (
        [...byDate.entries()].map(([date, items]) => (
          <section key={date} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-muted">
              {new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              })}
            </h2>
            {items.map((win) => (
              <Card key={win.id} className="flex flex-col gap-2">
                <p>{win.summary}</p>
                {win.impact && <p className="text-sm text-muted">{win.impact}</p>}
                <div className="flex flex-wrap items-center gap-1">
                  {win.metric && <Badge tone="accent">{win.metric}</Badge>}
                  {win.pillar_id && pillarName.get(win.pillar_id) && <Badge>{pillarName.get(win.pillar_id)}</Badge>}
                  {win.skills.map((s: string) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                  {win.confidential && <Badge tone="warning">Confidential</Badge>}
                </div>
                <form action={deleteWin}>
                  <input type="hidden" name="winId" value={win.id} />
                  <SubmitButton variant="ghost" className="px-0" pendingLabel="Deleting…">
                    Delete
                  </SubmitButton>
                </form>
              </Card>
            ))}
          </section>
        ))
      )}
    </>
  );
}
