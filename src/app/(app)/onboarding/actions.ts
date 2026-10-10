"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/data/session";
import { isValidTimeZone } from "@/lib/schedule/time";

const list = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

const OnboardingSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name").max(120),
  headline: z.string().trim().max(220),
  timezone: z.string().refine(isValidTimeZone, "Unknown time zone"),
  promptTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time"),
  postsPerWeek: z.coerce.number().int().min(0).max(14),
  pillars: z.array(z.string().max(80)).min(1, "Add at least one topic").max(5),
  targetRoles: z.array(z.string().max(80)).max(10),
  targetIndustries: z.array(z.string().max(80)).max(10),
  employerName: z.string().trim().max(120),
  employerPolicy: z.enum(["name", "generic", "never"]),
  neverMention: z.array(z.string().max(120)).max(50),
  numberPolicy: z.enum(["exact", "rounded", "relative"]),
  samplePosts: z.array(z.string().max(4000)).max(5),
});

export interface OnboardingState {
  error?: string;
}

export async function saveOnboarding(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const { supabase, user } = await requireUser({ allowIncompleteOnboarding: true });

  const parsed = OnboardingSchema.safeParse({
    fullName: formData.get("fullName"),
    headline: formData.get("headline") ?? "",
    timezone: formData.get("timezone"),
    promptTime: formData.get("promptTime"),
    postsPerWeek: formData.get("postsPerWeek"),
    pillars: [1, 2, 3, 4, 5].map((i) => String(formData.get(`pillar${i}`) ?? "").trim()).filter(Boolean),
    targetRoles: list(formData.get("targetRoles")),
    targetIndustries: list(formData.get("targetIndustries")),
    employerName: formData.get("employerName") ?? "",
    employerPolicy: formData.get("employerPolicy"),
    neverMention: list(formData.get("neverMention")),
    numberPolicy: formData.get("numberPolicy"),
    samplePosts: String(formData.get("samplePosts") ?? "")
      .split(/\n-{3,}\n/)
      .map((s) => s.trim())
      .filter(Boolean),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const v = parsed.data;

  const profile = await supabase
    .from("profiles")
    .update({
      full_name: v.fullName,
      headline: v.headline || null,
      timezone: v.timezone,
      prompt_time: v.promptTime,
      posts_per_week: v.postsPerWeek,
      target_roles: v.targetRoles,
      target_industries: v.targetIndustries,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (profile.error) return { error: "Could not save your profile. Please try again." };

  const rules = await supabase.from("confidentiality_rules").upsert({
    user_id: user.id,
    employer_name: v.employerName || null,
    employer_policy: v.employerPolicy,
    never_mention: v.neverMention,
    number_policy: v.numberPolicy,
  });
  if (rules.error) return { error: "Could not save your confidentiality settings." };

  const voice = await supabase.from("voice_profiles").upsert({ user_id: user.id, sample_posts: v.samplePosts });
  if (voice.error) return { error: "Could not save your sample posts." };

  // Replace pillars with the submitted list, keeping their order.
  const removed = await supabase.from("pillars").delete().eq("user_id", user.id);
  if (removed.error) return { error: "Could not save your topics." };
  const inserted = await supabase
    .from("pillars")
    .insert(v.pillars.map((name, position) => ({ user_id: user.id, name, position })));
  if (inserted.error) return { error: "Could not save your topics." };

  redirect("/today");
}
