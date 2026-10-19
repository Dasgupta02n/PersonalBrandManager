import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadProfile, type ProfileRow } from "./context";

/**
 * Returns the signed-in user, their Supabase client and profile, or redirects.
 * Use at the top of every app page and server action.
 */
export async function requireUser(options: { allowIncompleteOnboarding?: boolean; allowMissingConsent?: boolean } = {}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const profile = await loadProfile(supabase, data.user.id);
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed_at && !options.allowIncompleteOnboarding) redirect("/onboarding");
  // Accounts set up before consent was recorded confirm it once (new users give it during setup).
  if (profile.onboarding_completed_at && !profile.privacy_consent_at && !options.allowMissingConsent) redirect("/consent");

  return { supabase, user: data.user, profile: profile as ProfileRow };
}
