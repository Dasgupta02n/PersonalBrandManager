"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { friendlyAiError } from "@/lib/ai/errors";
import { suggestProfile } from "@/lib/ai/tasks";
import { requireAllowance } from "@/lib/billing/allowance";
import { loadRecentWins, loadUserContext } from "@/lib/data/context";
import { requireUser } from "@/lib/data/session";
import { usageRecorderFor } from "@/lib/data/usage";
import { addDays, localParts, weekStart } from "@/lib/schedule/time";

export interface ProfileState {
  status: "idle" | "done" | "error";
  message?: string;
}

const CurrentSchema = z.object({
  headline: z.string().trim().max(400),
  about: z.string().trim().max(3000),
  experience: z.string().trim().max(3000),
});

/** Suggests profile and CV updates from the last year of wins, replacing this week's earlier suggestions. */
export async function refreshProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const { supabase, user, profile } = await requireUser();
  const current = CurrentSchema.safeParse({
    headline: formData.get("headline") ?? "",
    about: formData.get("about") ?? "",
    experience: formData.get("experience") ?? "",
  });
  if (!current.success) return { status: "error", message: "One of those is too long to use." };

  const today = localParts(new Date(), profile.timezone).date;
  try {
    const wins = await loadRecentWins(supabase, user.id, { sinceDate: addDays(today, -365), limit: 40 });
    if (wins.length < 3) return { status: "error", message: "Log a few more wins first. Suggestions are built only from your record." };
    await requireAllowance(user.id);
    const ctx = await loadUserContext(supabase, user.id);
    const suggestions = await suggestProfile({ wins, current: current.data, ctx, onUsage: usageRecorderFor(user.id) });

    const week = weekStart(today);
    const currentText = { headline: current.data.headline, about: current.data.about, experience: current.data.experience, cv: current.data.experience, skills: "" };
    await supabase.from("profile_suggestions").delete().eq("user_id", user.id).eq("week_start", week).eq("status", "pending");
    const { error } = await supabase.from("profile_suggestions").insert(
      suggestions.map((s) => ({
        user_id: user.id,
        week_start: week,
        section: s.section,
        current_text: currentText[s.section],
        proposed_text: s.text,
        reason: s.reason,
      })),
    );
    if (error) throw new Error(`Could not save suggestions: ${error.message}`);
  } catch (error) {
    return { status: "error", message: friendlyAiError(error) };
  }
  revalidatePath("/wins/profile");
  return { status: "done" };
}

/** The user copied a suggestion into LinkedIn or their CV. */
export async function markApplied(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  await supabase.from("profile_suggestions").update({ status: "applied" }).eq("id", id.data).eq("user_id", user.id);
  revalidatePath("/wins/profile");
}
