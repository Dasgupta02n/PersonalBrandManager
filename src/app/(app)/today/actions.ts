"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { friendlyAiError } from "@/lib/ai/errors";
import { draftPost, extractWins, generatePostIdeas } from "@/lib/ai/tasks";
import { loadRecentWins, loadUserContext, toWin, WIN_COLUMNS, type WinRow } from "@/lib/data/context";
import { requireUser } from "@/lib/data/session";
import { usageRecorderFor } from "@/lib/data/usage";
import { addDays, localParts } from "@/lib/schedule/time";

export interface LogState {
  status: "idle" | "done" | "partial" | "error";
  message?: string;
}

const EntrySchema = z.string().trim().min(3, "Write a few words about what you did.").max(4000, "That's too long for one entry.");

export async function logEntry(_prev: LogState, formData: FormData): Promise<LogState> {
  const { supabase, user, profile } = await requireUser();
  const parsed = EntrySchema.safeParse(formData.get("text"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  const today = localParts(new Date(), profile.timezone).date;
  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .insert({ user_id: user.id, entry_date: today, raw_text: parsed.data, source: "web" })
    .select("id")
    .single();
  if (entryError || !entry) return { status: "error", message: "Could not save your entry. Please try again." };

  const onUsage = usageRecorderFor(user.id);
  const ctx = await loadUserContext(supabase, user.id);

  try {
    const extracted = await extractWins({ text: parsed.data, ctx, onUsage });
    if (extracted.wins.length) {
      const { error } = await supabase.from("wins").insert(
        extracted.wins.map((w) => ({
          user_id: user.id,
          journal_entry_id: entry.id,
          occurred_on: today,
          summary: w.summary,
          impact: w.impact,
          metric: w.metric,
          skills: w.skills,
          pillar_id: w.pillarId,
          confidential: w.confidential,
        })),
      );
      if (error) throw new Error(`Could not save wins: ${error.message}`);
    }
    if (extracted.followUpQuestion) {
      await supabase.from("journal_entries").update({ follow_up_question: extracted.followUpQuestion }).eq("id", entry.id);
    }
  } catch (error) {
    revalidatePath("/today");
    return { status: "partial", message: `Your entry is saved. ${friendlyAiError(error)}` };
  }

  try {
    const recent = await loadRecentWins(supabase, user.id, { sinceDate: addDays(today, -14), limit: 15 });
    const ideas = await generatePostIdeas({ wins: recent, ctx, count: 3, onUsage });
    if (ideas.length) {
      const { error } = await supabase.from("drafts").insert(
        ideas.map((idea) => ({
          user_id: user.id,
          kind: "post_idea",
          status: "idea",
          angle: idea.angle,
          hook: idea.hook,
          source_win_ids: idea.sourceWinIds,
        })),
      );
      if (error) throw new Error(`Could not save ideas: ${error.message}`);
    }
  } catch (error) {
    revalidatePath("/today");
    return { status: "partial", message: `Your wins are saved. ${friendlyAiError(error)}` };
  }

  revalidatePath("/today");
  return { status: "done", message: "Saved. Your wins and new post ideas are below." };
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
    .select("id, angle, hook, source_win_ids")
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
    const result = await draftPost({
      idea: { angle: idea.angle ?? "", hook: idea.hook ?? "", sourceWinIds: idea.source_win_ids },
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
