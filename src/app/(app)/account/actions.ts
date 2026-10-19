"use server";

import { redirect } from "next/navigation";
import { PRIVACY_EMAIL, PRIVACY_NOTICE_VERSION } from "@/lib/config/app";
import { serverEnv } from "@/lib/config/env";
import { requireUser } from "@/lib/data/session";
import { createAdminClient } from "@/lib/supabase/server";

export interface DeleteState {
  error?: string;
}

/**
 * Deletes the account and everything in it. Every user table references auth.users with
 * ON DELETE CASCADE; AI usage rows (no content) keep their cost figures without the user's id.
 */
export async function deleteAccount(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const { supabase, user } = await requireUser({ allowIncompleteOnboarding: true, allowMissingConsent: true });
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== "delete") {
    return { error: 'Type "delete" to confirm.' };
  }
  if (!serverEnv().SUPABASE_SECRET_KEY) {
    return { error: `Deletion isn't set up on this server yet. Email ${PRIVACY_EMAIL} and we'll delete everything.` };
  }
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) return { error: `Couldn't delete your account. Please try again, or email ${PRIVACY_EMAIL}.` };
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}

/** Records consent to the current privacy notice for accounts set up before it was asked. */
export async function recordConsent(formData: FormData) {
  const { supabase, user } = await requireUser({ allowMissingConsent: true });
  if (formData.get("consent") !== "on") redirect("/consent?missing=1");
  await supabase
    .from("profiles")
    .update({ privacy_consent_at: new Date().toISOString(), privacy_notice_version: PRIVACY_NOTICE_VERSION })
    .eq("id", user.id);
  redirect("/today");
}
