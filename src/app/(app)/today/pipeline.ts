import "server-only";
import { revalidatePath } from "next/cache";
import { friendlyAiError } from "@/lib/ai/errors";
import { extractWins, generatePostIdeas } from "@/lib/ai/tasks";
import { requireAllowance } from "@/lib/billing/allowance";
import { loadRecentWins, loadUserContext } from "@/lib/data/context";
import type { requireUser } from "@/lib/data/session";
import { usageRecorderFor } from "@/lib/data/usage";
import { maskTerms } from "@/lib/guardrails/check";
import { addDays, localParts } from "@/lib/schedule/time";

export interface LogState {
  status: "idle" | "done" | "partial" | "error";
  message?: string;
}

export type Session = Awaited<ReturnType<typeof requireUser>>;

/**
 * Saves a note and extracts wins. Each step that succeeds is kept, and the note is always saved
 * first, so the record has no gaps even when the AI step can't run. Post ideas come when the user
 * asks for them on Today; `withIdeas` also suggests them straight away (the first note at sign-up).
 * With "keep names out" on, never-mention terms are masked before the note is stored, and the
 * stored note is replaced by the AI's version with people referred to by role.
 */
export async function processEntry({ supabase, user, profile }: Session, text: string, { withIdeas = false } = {}): Promise<LogState> {
  const today = localParts(new Date(), profile.timezone).date;
  const ctx = await loadUserContext(supabase, user.id);
  const stored = ctx.rules.maskNames ? maskTerms(text, ctx.rules.neverMention) : text;
  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .insert({ user_id: user.id, entry_date: today, raw_text: stored, source: "web" })
    .select("id")
    .single();
  if (entryError || !entry) return { status: "error", message: "Couldn't save your note. Please try again; your text is still here." };

  const onUsage = usageRecorderFor(user.id);

  try {
    await requireAllowance(user.id);
    const extracted = await extractWins({ text, ctx, onUsage });
    if (extracted.maskedNote) {
      await supabase
        .from("journal_entries")
        .update({ raw_text: maskTerms(extracted.maskedNote, ctx.rules.neverMention) })
        .eq("id", entry.id);
    }
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
          kind: w.kind,
        })),
      );
      if (error) throw new Error(`Could not save wins: ${error.message}`);
    } else {
      revalidatePath("/today");
      return {
        status: "partial",
        message: "Saved. Couldn't find a clear win yet. Add one detail — who it helped, or what changed?",
      };
    }
    if (extracted.followUpQuestion) {
      await supabase.from("journal_entries").update({ follow_up_question: extracted.followUpQuestion }).eq("id", entry.id);
    }
  } catch (error) {
    revalidatePath("/today");
    return { status: "partial", message: `Your note is saved. ${friendlyAiError(error)}` };
  }

  if (!withIdeas) {
    revalidatePath("/today");
    return { status: "done", message: "Saved. Your wins are below." };
  }

  try {
    await suggestIdeas({ supabase, user, profile }, today);
  } catch (error) {
    revalidatePath("/today");
    return { status: "partial", message: `Your wins are saved. ${friendlyAiError(error)}` };
  }

  revalidatePath("/today");
  return { status: "done", message: "Saved. Your wins and three ways to share them are below." };
}

/** Adds fresh ideas from the last 30 days of wins and retires the ones still waiting, so Today shows the new ones. */
export async function suggestIdeas({ supabase, user }: Session, today: string, avoidAngles: string[] = []) {
  const ctx = await loadUserContext(supabase, user.id);
  const recent = await loadRecentWins(supabase, user.id, { sinceDate: addDays(today, -30), limit: 15 });
  const ideas = await generatePostIdeas({ wins: recent, ctx, count: 3, avoidAngles, onUsage: usageRecorderFor(user.id) });
  if (!ideas.length) return 0;
  await supabase.from("drafts").update({ status: "discarded" }).eq("user_id", user.id).eq("kind", "post_idea").eq("status", "idea");
  const { error } = await supabase.from("drafts").insert(
    ideas.map((idea) => ({
      user_id: user.id,
      kind: "post_idea",
      status: "idea",
      post_format: idea.format,
      angle: idea.angle,
      hook: idea.hook,
      source_win_ids: idea.sourceWinIds,
    })),
  );
  if (error) throw new Error(`Could not save ideas: ${error.message}`);
  return ideas.length;
}
