import "server-only";
import { revalidatePath } from "next/cache";
import { friendlyAiError } from "@/lib/ai/errors";
import { extractWins, generatePostIdeas } from "@/lib/ai/tasks";
import { loadRecentWins, loadUserContext } from "@/lib/data/context";
import type { requireUser } from "@/lib/data/session";
import { usageRecorderFor } from "@/lib/data/usage";
import { addDays, localParts } from "@/lib/schedule/time";

export interface LogState {
  status: "idle" | "done" | "partial" | "error";
  message?: string;
}

export type Session = Awaited<ReturnType<typeof requireUser>>;

/** Saves a note, extracts wins and suggests post ideas. Each step that succeeds is kept. */
export async function processEntry({ supabase, user, profile }: Session, text: string): Promise<LogState> {
  const today = localParts(new Date(), profile.timezone).date;
  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .insert({ user_id: user.id, entry_date: today, raw_text: text, source: "web" })
    .select("id")
    .single();
  if (entryError || !entry) return { status: "error", message: "Couldn't save your note. Please try again; your text is still here." };

  const onUsage = usageRecorderFor(user.id);
  const ctx = await loadUserContext(supabase, user.id);

  try {
    const extracted = await extractWins({ text, ctx, onUsage });
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

  try {
    await suggestIdeas({ supabase, user, profile }, today);
  } catch (error) {
    revalidatePath("/today");
    return { status: "partial", message: `Your wins are saved. ${friendlyAiError(error)}` };
  }

  revalidatePath("/today");
  return { status: "done", message: "Saved. Your wins and three ways to share them are below." };
}

export async function suggestIdeas({ supabase, user }: Session, today: string, avoidAngles: string[] = []) {
  const ctx = await loadUserContext(supabase, user.id);
  const recent = await loadRecentWins(supabase, user.id, { sinceDate: addDays(today, -30), limit: 15 });
  const ideas = await generatePostIdeas({ wins: recent, ctx, count: 3, avoidAngles, onUsage: usageRecorderFor(user.id) });
  if (!ideas.length) return 0;
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
