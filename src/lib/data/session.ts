import "server-only";
import { redirect } from "next/navigation";
import { PRIVACY_NOTICE_VERSION } from "@/lib/config/app";
import { currentUser } from "@/lib/auth/session";
import { userDb } from "@/lib/db/client";
import { loadProfile, type ProfileRow } from "./context";

/**
 * Returns the signed-in user, their database access and profile, or redirects.
 * Use at the top of every app page and server action.
 */
export async function requireUser(options: { allowIncompleteOnboarding?: boolean; allowMissingConsent?: boolean } = {}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const db = userDb(user.id);
  const profile = await loadProfile(db, user.id);
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed_at && !options.allowIncompleteOnboarding) redirect("/onboarding");
  // Consent is asked again whenever the notice changes materially (its version is bumped);
  // new users give it during setup.
  const consentCurrent = profile.privacy_consent_at && profile.privacy_notice_version === PRIVACY_NOTICE_VERSION;
  if (profile.onboarding_completed_at && !consentCurrent && !options.allowMissingConsent) redirect("/consent");

  return { db, user, profile: profile as ProfileRow };
}
