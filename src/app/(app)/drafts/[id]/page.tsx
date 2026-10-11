import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { normalizeReport, type GuardrailReport } from "@/lib/ai/tasks";
import { requireUser } from "@/lib/data/session";
import type { PostFormat, WinKind } from "@/lib/domain/types";
import { DraftWorkspace } from "./workspace";

export const metadata: Metadata = { title: "Draft" };

export default async function DraftPage({ params }: PageProps<"/drafts/[id]">) {
  const { id } = await params;
  const { supabase, user, profile } = await requireUser();
  const { data: draft } = await supabase
    .from("drafts")
    .select("id, status, post_format, body, hashtags, guardrails, source_win_ids, posted_at, post_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("kind", "post")
    .maybeSingle();
  if (!draft || draft.status === "discarded") notFound();

  const { data: wins } = draft.source_win_ids.length
    ? await supabase.from("wins").select("id, summary, kind").eq("user_id", user.id).in("id", draft.source_win_ids)
    : { data: [] };

  return (
    <DraftWorkspace
      draftId={draft.id}
      status={draft.status as "draft" | "ready" | "posted"}
      format={(draft.post_format ?? null) as PostFormat | null}
      body={draft.body}
      hashtags={draft.hashtags}
      report={normalizeReport(draft.guardrails as Partial<GuardrailReport> | null)}
      sources={(wins ?? []).map((w) => ({ id: w.id, summary: w.summary, kind: w.kind as WinKind }))}
      author={{ name: profile.full_name ?? "You", headline: profile.headline ?? "" }}
      postedAt={draft.posted_at}
      postUrl={draft.post_url}
    />
  );
}
