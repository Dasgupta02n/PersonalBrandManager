import type { Metadata } from "next";
import { loadUserContext } from "@/lib/data/context";
import { requireUser } from "@/lib/data/session";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Settings" };

export default async function OnboardingPage() {
  const { supabase, user, profile } = await requireUser({ allowIncompleteOnboarding: true, allowMissingConsent: true });
  const ctx = await loadUserContext(supabase, user.id);

  return (
    <OnboardingForm
      mode={profile.onboarding_completed_at ? "settings" : "setup"}
      defaults={{
        fullName: profile.full_name ?? "",
        headline: profile.headline ?? "",
        timezone: profile.timezone,
        promptTime: profile.prompt_time.slice(0, 5),
        promptChannel: profile.prompt_channel,
        routineCue: profile.routine_cue ?? "",
        postsPerWeek: profile.posts_per_week,
        tone: profile.tone,
        pillars: ctx.pillars.map((p) => p.name),
        targetRoles: profile.target_roles.join(", "),
        targetIndustries: profile.target_industries.join(", "),
        employerName: ctx.rules.employerName ?? "",
        employerPolicy: ctx.rules.employerPolicy,
        neverMention: ctx.rules.neverMention.join("\n"),
        noGoTopics: ctx.rules.noGoTopics.join(", "),
        numberPolicy: ctx.rules.numberPolicy,
        regulated: ctx.rules.regulated,
        maskNames: ctx.rules.maskNames,
        samplePosts: ctx.voice.samplePosts.join("\n---\n"),
      }}
    />
  );
}
