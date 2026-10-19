import "server-only";
import { redirect } from "next/navigation";
import { PRIVACY_NOTICE_VERSION } from "@/lib/config/app";
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
  // Consent is asked again whenever the notice changes materially (its version is bumped);
  // new users give it during setup.
  const consentCurrent = profile.privacy_consent_at && profile.privacy_notice_version === PRIVACY_NOTICE_VERSION;
  if (profile.onboarding_completed_at && !consentCurrent && !options.allowMissingConsent) redirect("/consent");

  return { supabase, user: data.user, profile: profile as ProfileRow };
}
