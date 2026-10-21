"use server";

import { redirect } from "next/navigation";
import { PRIVACY_EMAIL, PRIVACY_NOTICE_VERSION } from "@/lib/config/app";
import { endSession } from "@/lib/auth/session";
import { requireUser } from "@/lib/data/session";
import { serviceDb } from "@/lib/db/client";

export interface DeleteState {
  error?: string;
}

/**
 * Deletes the account and everything in it. Every user table references users with
 * ON DELETE CASCADE; AI usage rows (no content) keep their cost figures without the user's id.
 */
export async function deleteAccount(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const { user } = await requireUser({ allowIncompleteOnboarding: true, allowMissingConsent: true });
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== "delete") {
    return { error: 'Type "delete" to confirm.' };
  }
  const { error } = await serviceDb().from("users").delete().eq("id", user.id);
  if (error) return { error: `Couldn't delete your account. Please try again, or email ${PRIVACY_EMAIL}.` };
  await endSession();
  redirect("/?deleted=1");
}

/** Records consent to the current privacy notice for accounts set up before it was asked. */
export async function recordConsent(formData: FormData) {
  const { db, user } = await requireUser({ allowMissingConsent: true });
  if (formData.get("consent") !== "on") redirect("/consent?missing=1");
  await db
    .from("profiles")
    .update({ privacy_consent_at: new Date().toISOString(), privacy_notice_version: PRIVACY_NOTICE_VERSION })
    .eq("id", user.id);
  redirect("/today");
}
