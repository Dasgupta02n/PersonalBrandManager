"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/data/session";
import { localParts } from "@/lib/schedule/time";

export interface OpportunityState {
  status: "idle" | "saved" | "error";
  message?: string;
}

const OpportunitySchema = z.object({
  kind: z.enum(["headhunter", "invitation", "meeting", "inbound_lead", "other"]),
  description: z.string().trim().min(3, "Add a few words about what came to you.").max(500),
  occurredOn: z.iso.date(),
});

/** Logs something that came to the user: the outcome the weekly scorecard leads with. */
export async function logOpportunity(_prev: OpportunityState, formData: FormData): Promise<OpportunityState> {
  const { supabase, user, profile } = await requireUser();
  const parsed = OpportunitySchema.safeParse({
    kind: formData.get("kind"),
    description: formData.get("description"),
    occurredOn: formData.get("occurredOn") || localParts(new Date(), profile.timezone).date,
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  const { error } = await supabase.from("opportunities").insert({
    user_id: user.id,
    kind: parsed.data.kind,
    description: parsed.data.description,
    occurred_on: parsed.data.occurredOn,
  });
  if (error) return { status: "error", message: "Couldn't save it. Please try again." };
  revalidatePath("/wins/week");
  return { status: "saved", message: "Logged." };
}

export async function deleteOpportunity(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  await supabase.from("opportunities").delete().eq("id", id.data).eq("user_id", user.id);
  revalidatePath("/wins/week");
}
