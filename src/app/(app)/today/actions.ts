"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { friendlyAiError } from "@/lib/ai/errors";
import { draftPost } from "@/lib/ai/tasks";
import { loadUserContext, toWin, WIN_COLUMNS, type WinRow } from "@/lib/data/context";
import { requireUser } from "@/lib/data/session";
import { usageRecorderFor } from "@/lib/data/usage";
import type { PostFormat } from "@/lib/domain/types";
import { localParts } from "@/lib/schedule/time";
import { processEntry, suggestIdeas, type LogState } from "./pipeline";

export type { LogState } from "./pipeline";

const EntrySchema = z.string().trim().min(3, "Write a few words about what moved forward.").max(4000, "That's too long for one note.");

export async function logEntry(_prev: LogState, formData: FormData): Promise<LogState> {
  const session = await requireUser();
  const parsed = EntrySchema.safeParse(formData.get("text"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  return processEntry(session, parsed.data);
}

const AnswerSchema = z.object({
  entryId: z.uuid(),
  answer: z.string().trim().min(1, "Write a short answer, or skip the question.").max(1000),
});

/** Answers the follow-up question as a new note, then clears the question. */
export async function answerFollowUp(_prev: LogState, formData: FormData): Promise<LogState> {
  const session = await requireUser();
  const parsed = AnswerSchema.safeParse({ entryId: formData.get("entryId"), answer: formData.get("answer") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  const { data: entry } = await session.supabase
    .from("journal_entries")
    .select("raw_text, follow_up_question")
    .eq("id", parsed.data.entryId)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!entry?.follow_up_question) return { status: "error", message: "That question was already answered." };

  await session.supabase.from("journal_entries").update({ follow_up_question: null }).eq("id", parsed.data.entryId);
  return processEntry(session, `${entry.raw_text}\n\n${entry.follow_up_question} ${parsed.data.answer}`);
}

export async function skipFollowUp(formData: FormData) {
  const { supabase, user } = await requireUser();
  const entryId = z.uuid().safeParse(formData.get("entryId"));
  if (!entryId.success) return;
  await supabase.from("journal_entries").update({ follow_up_question: null }).eq("id", entryId.data).eq("user_id", user.id);
  revalidatePath("/today");
}

export interface IdeasState {
  error?: string;
}

/** Fresh post ideas from the last 30 days of wins, avoiding angles already shown. */
export async function moreIdeas(): Promise<IdeasState> {
  const session = await requireUser();
  const { supabase, user, profile } = session;
  const today = localParts(new Date(), profile.timezone).date;

  const { data: shown } = await supabase
    .from("drafts")
    .select("id, angle")
    .eq("user_id", user.id)
    .eq("kind", "post_idea")
    .eq("status", "idea");

  try {
    const added = await suggestIdeas(session, today, (shown ?? []).map((d) => d.angle ?? "").filter(Boolean));
    if (!added) return { error: "Log a win first; ideas are built only from your real work." };
    if (shown?.length) {
      await supabase
        .from("drafts")
        .update({ status: "discarded" })
        .eq("user_id", user.id)
        .in(
          "id",
          shown.map((d) => d.id),
        );
    }
  } catch (error) {
    return { error: friendlyAiError(error) };
  }
  revalidatePath("/today");
  return {};
}

export interface DraftState {
  error?: string;
}

export async function writeDraftFromIdea(_prev: DraftState, formData: FormData): Promise<DraftState> {
  const { supabase, user } = await requireUser();
  const ideaId = z.uuid().safeParse(formData.get("ideaId"));
  if (!ideaId.success) return { error: "That idea could not be found." };

  const { data: idea } = await supabase
    .from("drafts")
    .select("id, angle, hook, source_win_ids, post_format")
    .eq("id", ideaId.data)
    .eq("user_id", user.id)
    .eq("kind", "post_idea")
    .maybeSingle();
  if (!idea) return { error: "That idea could not be found." };

  const { data: winRows } = await supabase
    .from("wins")
    .select(WIN_COLUMNS)
    .eq("user_id", user.id)
    .in("id", idea.source_win_ids);
  const wins = ((winRows ?? []) as WinRow[]).map(toWin);
  if (!wins.length) return { error: "The wins behind this idea were deleted." };

  let draftId: string;
  try {
    const ctx = await loadUserContext(supabase, user.id);
    const format = (idea.post_format ?? "lesson") as PostFormat;
    const result = await draftPost({
      idea: { format, angle: idea.angle ?? "", hook: idea.hook ?? "", sourceWinIds: idea.source_win_ids },
      wins,
      ctx,
      onUsage: usageRecorderFor(user.id),
    });
    const { data: draft, error } = await supabase
      .from("drafts")
      .insert({
        user_id: user.id,
        kind: "post",
        status: result.report.passed ? "ready" : "draft",
        parent_id: idea.id,
        post_format: format,
        angle: idea.angle,
        hook: result.hook,
        body: result.body,
        hashtags: result.hashtags,
        source_win_ids: idea.source_win_ids,
        guardrails: result.report,
      })
      .select("id")
      .single();
    if (error || !draft) throw new Error(`Could not save draft: ${error?.message}`);
    draftId = draft.id;
    await supabase.from("drafts").update({ status: "draft" }).eq("id", idea.id);
  } catch (error) {
    return { error: friendlyAiError(error) };
  }

  revalidatePath("/today");
  revalidatePath("/drafts");
  redirect(`/drafts/${draftId}`);
}

export async function dismissIdea(formData: FormData) {
  const { supabase, user } = await requireUser();
  const ideaId = z.uuid().safeParse(formData.get("ideaId"));
  if (!ideaId.success) return;
  await supabase.from("drafts").update({ status: "discarded" }).eq("id", ideaId.data).eq("user_id", user.id);
  revalidatePath("/today");
}
