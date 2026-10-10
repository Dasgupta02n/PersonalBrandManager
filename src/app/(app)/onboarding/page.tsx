import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { loadUserContext } from "@/lib/data/context";
import { requireUser } from "@/lib/data/session";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Set up" };

export default async function OnboardingPage() {
  const { supabase, user, profile } = await requireUser({ allowIncompleteOnboarding: true });
  const ctx = await loadUserContext(supabase, user.id);

  return (
    <>
      <PageHeader
        title={profile.onboarding_completed_at ? "Your settings" : "Let's set you up"}
        description="About 5 minutes. You can change any of this later."
      />
      <OnboardingForm
        defaults={{
          fullName: profile.full_name ?? "",
          headline: profile.headline ?? "",
          timezone: profile.timezone,
          promptTime: profile.prompt_time.slice(0, 5),
          postsPerWeek: profile.posts_per_week,
          pillars: ctx.pillars.map((p) => p.name),
          targetRoles: profile.target_roles.join(", "),
          targetIndustries: profile.target_industries.join(", "),
          employerName: ctx.rules.employerName ?? "",
          employerPolicy: ctx.rules.employerPolicy,
          neverMention: ctx.rules.neverMention.join("\n"),
          numberPolicy: ctx.rules.numberPolicy,
          samplePosts: ctx.voice.samplePosts.join("\n---\n"),
        }}
      />
    </>
  );
}
