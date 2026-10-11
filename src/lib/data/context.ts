import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_RULES, type PromptChannel, type Tone, type UserContext, type Win, type WinKind } from "@/lib/domain/types";

export interface ProfileRow {
  id: string;
  full_name: string | null;
  headline: string | null;
  timezone: string;
  prompt_time: string;
  prompt_channel: PromptChannel;
  posts_per_week: number;
  tone: Tone;
  routine_cue: string | null;
  target_industries: string[];
  target_roles: string[];
  onboarding_completed_at: string | null;
}

export interface WinRow {
  id: string;
  occurred_on: string;
  summary: string;
  impact: string;
  metric: string | null;
  skills: string[];
  pillar_id: string | null;
  confidential: boolean;
  kind: WinKind;
}

export const WIN_COLUMNS = "id, occurred_on, summary, impact, metric, skills, pillar_id, confidential, kind";

export function toWin(row: WinRow): Win {
  return {
    id: row.id,
    occurredOn: row.occurred_on,
    summary: row.summary,
    impact: row.impact,
    metric: row.metric,
    skills: row.skills,
    pillarId: row.pillar_id,
    confidential: row.confidential,
    kind: row.kind,
  };
}

export async function loadProfile(supabase: SupabaseClient, userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, headline, timezone, prompt_time, prompt_channel, posts_per_week, tone, routine_cue, " +
        "target_industries, target_roles, onboarding_completed_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`Could not load profile: ${error.message}`);
  return data as ProfileRow | null;
}

/** Everything the AI needs to write in the user's voice and respect their settings. */
export async function loadUserContext(supabase: SupabaseClient, userId: string): Promise<UserContext> {
  const [profile, pillars, voice, rules] = await Promise.all([
    loadProfile(supabase, userId),
    supabase.from("pillars").select("id, name, description").eq("user_id", userId).order("position"),
    supabase.from("voice_profiles").select("summary, sample_posts").eq("user_id", userId).maybeSingle(),
    supabase
      .from("confidentiality_rules")
      .select("employer_name, employer_policy, never_mention, number_policy, no_go_topics")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  for (const result of [pillars, voice, rules]) {
    if (result.error) throw new Error(`Could not load your settings: ${result.error.message}`);
  }

  return {
    fullName: profile?.full_name ?? null,
    headline: profile?.headline ?? null,
    targetIndustries: profile?.target_industries ?? [],
    targetRoles: profile?.target_roles ?? [],
    tone: profile?.tone ?? "balanced",
    pillars: (pillars.data ?? []).map((p) => ({ id: p.id, name: p.name, description: p.description })),
    voice: {
      summary: voice.data?.summary ?? "",
      samplePosts: voice.data?.sample_posts ?? [],
    },
    rules: rules.data
      ? {
          employerName: rules.data.employer_name,
          employerPolicy: rules.data.employer_policy,
          neverMention: rules.data.never_mention,
          numberPolicy: rules.data.number_policy,
          noGoTopics: rules.data.no_go_topics ?? [],
        }
      : DEFAULT_RULES,
  };
}

export async function loadRecentWins(
  supabase: SupabaseClient,
  userId: string,
  options: { sinceDate?: string; limit?: number } = {},
): Promise<Win[]> {
  let query = supabase
    .from("wins")
    .select(WIN_COLUMNS)
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 20);
  if (options.sinceDate) query = query.gte("occurred_on", options.sinceDate);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load wins: ${error.message}`);
  return (data as WinRow[]).map(toWin);
}
