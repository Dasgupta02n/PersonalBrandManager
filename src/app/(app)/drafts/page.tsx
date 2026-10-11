import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, CircleCheck, FileText, Send } from "lucide-react";
import { EmptyState, PageHeader, buttonClass, cx } from "@/components/ui";
import { normalizeReport, type GuardrailReport } from "@/lib/ai/tasks";
import { FORMAT_LABEL } from "@/lib/content/labels";
import { blockingIssues } from "@/lib/content/verdict";
import { requireUser } from "@/lib/data/session";
import type { PostFormat } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Drafts" };

const VIEWS = [
  { key: "ready", label: "Ready", statuses: ["ready"] },
  { key: "review", label: "Needs a look", statuses: ["draft"] },
  { key: "posted", label: "Posted", statuses: ["posted"] },
] as const;
type ViewKey = (typeof VIEWS)[number]["key"];

interface Row {
  id: string;
  hook: string | null;
  body: string;
  status: string;
  post_format: string | null;
  posted_at: string | null;
  guardrails: unknown;
}

export default async function DraftsPage({ searchParams }: PageProps<"/drafts">) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("drafts")
    .select("id, hook, body, status, post_format, posted_at, guardrails")
    .eq("user_id", user.id)
    .eq("kind", "post")
    .in("status", ["ready", "draft", "posted"])
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as Row[];
  const counts = Object.fromEntries(
    VIEWS.map((v) => [v.key, rows.filter((r) => (v.statuses as readonly string[]).includes(r.status)).length]),
  ) as Record<ViewKey, number>;

  const requested = (await searchParams).view;
  const fallback = VIEWS.find((v) => counts[v.key] > 0)?.key ?? "ready";
  const view: ViewKey = VIEWS.some((v) => v.key === requested) ? (requested as ViewKey) : fallback;
  const current = VIEWS.find((v) => v.key === view)!;
  const visible = rows.filter((r) => (current.statuses as readonly string[]).includes(r.status));

  return (
    <>
      <PageHeader title="Drafts" description="Nothing goes to LinkedIn until you copy it and post it yourself." />

      <nav aria-label="Filter drafts" className="grid grid-cols-3 rounded-xl bg-surface p-1">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`/drafts?view=${v.key}`}
            aria-current={v.key === view ? "page" : undefined}
            className={cx(
              "flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition",
              v.key === view ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground",
            )}
          >
            {v.label}
            <span className="tabular-nums text-muted">{counts[v.key]}</span>
          </Link>
        ))}
      </nav>

      {visible.length ? (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {visible.map((row) => (
            <DraftRow key={row.id} row={row} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={view === "posted" ? Send : FileText}
          title={view === "posted" ? "Nothing posted yet" : "No drafts here"}
          action={
            view !== "posted" ? (
              <Link href="/today" className={buttonClass("secondary", undefined, "sm")}>
                Pick an idea on Today
              </Link>
            ) : undefined
          }
        >
          {view === "posted" ? "Posts you mark as posted collect here." : "Drafts appear when you choose “Write this post” on an idea."}
        </EmptyState>
      )}
    </>
  );
}

function DraftRow({ row }: { row: Row }) {
  const report = normalizeReport(row.guardrails as Partial<GuardrailReport> | null);
  const blocked = blockingIssues(report).length > 0;
  const firstLine = row.hook || row.body.split("\n")[0];
  return (
    <li>
      <Link href={`/drafts/${row.id}`} className="flex flex-col gap-1.5 py-4 transition hover:opacity-80">
        <p className="text-[13px] font-medium text-muted">
          {row.post_format ? FORMAT_LABEL[row.post_format as PostFormat] : "Post"}
          {row.status === "posted" && row.posted_at &&
            ` · Posted ${new Date(row.posted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
        </p>
        <p className="font-semibold text-balance">{firstLine}</p>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{row.body.replace(firstLine, "").trim()}</p>
        {row.status !== "posted" && (
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium">
            {blocked ? (
              <>
                <CircleAlert aria-hidden className="size-4 text-danger" /> Something to fix before posting
              </>
            ) : row.status === "ready" ? (
              <>
                <CircleCheck aria-hidden className="size-4 text-success" /> Safe to post
              </>
            ) : (
              <>
                <CircleAlert aria-hidden className="size-4" /> Worth a look
              </>
            )}
          </p>
        )}
      </Link>
    </li>
  );
}
