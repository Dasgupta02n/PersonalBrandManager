import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/data/session";

export const metadata: Metadata = { title: "Drafts" };

const STATUS_LABEL = {
  ready: { label: "Ready to post", tone: "success" },
  draft: { label: "Needs review", tone: "warning" },
  posted: { label: "Posted", tone: "neutral" },
} as const;

export default async function DraftsPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("drafts")
    .select("id, hook, body, status, posted_at, created_at")
    .eq("user_id", user.id)
    .eq("kind", "post")
    .in("status", ["ready", "draft", "posted"])
    .order("created_at", { ascending: false })
    .limit(50);

  const drafts = data ?? [];
  const open = drafts.filter((d) => d.status !== "posted");
  const posted = drafts.filter((d) => d.status === "posted");

  return (
    <>
      <PageHeader title="Drafts" description="Review, copy and post. Nothing goes to LinkedIn without you." />
      {open.length ? (
        <div className="flex flex-col gap-3">
          {open.map((d) => (
            <DraftRow key={d.id} draft={d} />
          ))}
        </div>
      ) : (
        <EmptyState>
          No open drafts. Pick an idea on the <Link href="/today" className="font-semibold text-accent">Today</Link>{" "}
          page.
        </EmptyState>
      )}
      {posted.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Posted</h2>
          {posted.map((d) => (
            <DraftRow key={d.id} draft={d} />
          ))}
        </section>
      )}
    </>
  );
}

function DraftRow({ draft }: { draft: { id: string; hook: string | null; body: string; status: string } }) {
  const status = STATUS_LABEL[draft.status as keyof typeof STATUS_LABEL];
  return (
    <Link href={`/drafts/${draft.id}`} className="block">
      <Card className="flex flex-col gap-2 transition hover:border-accent">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold">{draft.hook || draft.body.split("\n")[0]}</p>
          {status && <Badge tone={status.tone}>{status.label}</Badge>}
        </div>
        <p className="line-clamp-2 text-sm text-muted">{draft.body}</p>
      </Card>
    </Link>
  );
}
