"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/data/session";
import { isValidTimeZone } from "@/lib/schedule/time";
import { processEntry } from "../today/pipeline";

const list = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

const OnboardingSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name.").max(120),
  headline: z.string().trim().max(220),
  timezone: z.string().refine(isValidTimeZone, "Unknown time zone."),
  promptTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time."),
  promptChannel: z.enum(["email", "whatsapp", "web_push"]),
  routineCue: z.string().trim().max(120),
  postsPerWeek: z.coerce.number().int().min(0).max(14),
  tone: z.enum(["reserved", "balanced", "open"]),
  pillars: z.array(z.string().max(80)).min(1, "Add at least one topic you want to be known for.").max(5),
  targetRoles: z.array(z.string().max(80)).max(10),
  targetIndustries: z.array(z.string().max(80)).max(10),
  employerName: z.string().trim().max(120),
  employerPolicy: z.enum(["name", "generic", "never"]),
  neverMention: z.array(z.string().max(120)).max(50),
  noGoTopics: z.array(z.string().max(80)).max(20),
  numberPolicy: z.enum(["exact", "rounded", "relative"]),
  samplePosts: z.array(z.string().max(4000)).max(5),
  firstWin: z.string().trim().max(4000),
});

export interface OnboardingState {
  error?: string;
}

/**
 * Saves setup (first run) and settings (later). Fields a form doesn't show are left untouched,
 * so the short setup never wipes audience or voice settings.
 */
export async function saveOnboarding(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const session = await requireUser({ allowIncompleteOnboarding: true });
  const { supabase, user, profile: current } = session;

  const parsed = OnboardingSchema.safeParse({
    fullName: formData.get("fullName"),
    headline: formData.get("headline") ?? "",
    timezone: formData.get("timezone"),
    promptTime: formData.get("promptTime"),
    promptChannel: formData.get("promptChannel") ?? "email",
    routineCue: formData.get("routineCue") ?? "",
    postsPerWeek: formData.get("postsPerWeek"),
    tone: formData.get("tone") ?? "balanced",
    pillars: [1, 2, 3, 4, 5].map((i) => String(formData.get(`pillar${i}`) ?? "").trim()).filter(Boolean),
    targetRoles: list(formData.get("targetRoles")),
    targetIndustries: list(formData.get("targetIndustries")),
    employerName: formData.get("employerName") ?? "",
    employerPolicy: formData.get("employerPolicy"),
    neverMention: list(formData.get("neverMention")),
    noGoTopics: list(formData.get("noGoTopics")),
    numberPolicy: formData.get("numberPolicy"),
    samplePosts: String(formData.get("samplePosts") ?? "")
      .split(/\n-{3,}\n/)
      .map((s) => s.trim())
      .filter(Boolean),
    firstWin: formData.get("firstWin") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const v = parsed.data;

  const profileUpdate = await supabase
    .from("profiles")
    .update({
      full_name: v.fullName,
      headline: v.headline || null,
      timezone: v.timezone,
      prompt_time: v.promptTime,
      prompt_channel: v.promptChannel,
      routine_cue: v.routineCue || null,
      posts_per_week: v.postsPerWeek,
      tone: v.tone,
      ...(formData.has("targetRoles") ? { target_roles: v.targetRoles } : {}),
      ...(formData.has("targetIndustries") ? { target_industries: v.targetIndustries } : {}),
      onboarding_completed_at: current.onboarding_completed_at ?? new Date().toISOString(),
    })
    .eq("id", user.id);
  if (profileUpdate.error) return { error: "Couldn't save your profile. Please try again." };

  const rules = await supabase.from("confidentiality_rules").upsert({
    user_id: user.id,
    employer_name: v.employerName || null,
    employer_policy: v.employerPolicy,
    never_mention: v.neverMention,
    no_go_topics: v.noGoTopics,
    number_policy: v.numberPolicy,
  });
  if (rules.error) return { error: "Couldn't save your confidentiality settings." };

  if (formData.has("samplePosts")) {
    const voice = await supabase.from("voice_profiles").upsert({ user_id: user.id, sample_posts: v.samplePosts });
    if (voice.error) return { error: "Couldn't save your sample posts." };
  }

  // Replace pillars with the submitted list, keeping their order.
  const removed = await supabase.from("pillars").delete().eq("user_id", user.id);
  if (removed.error) return { error: "Couldn't save your topics." };
  const inserted = await supabase
    .from("pillars")
    .insert(v.pillars.map((name, position) => ({ user_id: user.id, name, position })));
  if (inserted.error) return { error: "Couldn't save your topics." };

  // Setup ends on value: the first win becomes wins and ideas straight away.
  if (v.firstWin.length >= 3) {
    const fresh = await requireUser();
    await processEntry(fresh, v.firstWin);
  }

  revalidatePath("/", "layout");
  redirect("/today");
}
