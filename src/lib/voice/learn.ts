import "server-only";
import type { Db } from "@/lib/db/query";
import { learnVoice } from "@/lib/ai/tasks";
import { requireAllowance } from "@/lib/billing/allowance";
import { loadUserContext } from "@/lib/data/context";
import { usageRecorderFor } from "@/lib/data/usage";
import type { PostFormat } from "@/lib/domain/types";
import {
  learnFromEdit,
  learnFromRevision,
  learnFromSkippedIdea,
  readStats,
  type EditStats,
  type Note,
} from "./notebook";

// Writes to the user's own style notebook (voice_profiles, row-level security applies).
// Learning never blocks or fails the user's action.

interface VoiceRow {
  summary: string;
  sample_posts: string[];
  notes: Note[];
  muted: string[];
  edit_stats: unknown;
}

/** After this many edited posts, the AI refreshes what it has learned. */
export const REFRESH_AFTER_EDITS = 3;

async function loadRow(db: Db, userId: string): Promise<VoiceRow | null> {
  const { data } = await db
    .from("voice_profiles")
    .select("summary, sample_posts, notes, muted, edit_stats")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as VoiceRow | null) ?? null;
}

async function updateStats(db: Db, userId: string, change: (stats: EditStats) => EditStats): Promise<EditStats | null> {
  try {
    const row = await loadRow(db, userId);
    const next = change(readStats(row?.edit_stats));
    const { error } = await db.from("voice_profiles").upsert({ user_id: userId, edit_stats: next });
    if (error) throw new Error(error.message);
    return next;
  } catch (error) {
    console.error("style notebook update failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Learns from what the user changed between our draft and what they posted. */
export function recordEdit(db: Db, userId: string, drafted: string, posted: string) {
  return updateStats(db, userId, (stats) => learnFromEdit(stats, drafted, posted));
}

export function recordSkippedIdea(db: Db, userId: string, format: PostFormat) {
  return updateStats(db, userId, (stats) => learnFromSkippedIdea(stats, format));
}

export function recordRevision(db: Db, userId: string, mode: string) {
  return updateStats(db, userId, (stats) => learnFromRevision(stats, mode));
}

/** A stable key for a learned observation, so a removed one is never suggested again. */
export function learnedKey(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `ai:${slug}`;
}

/**
 * Asks the AI what the samples and recent edits say about the user's style, and replaces the
 * learned observations with its answer. The user's own notes and removals are kept.
 */
export async function refreshNotebook(db: Db, userId: string): Promise<{ learned: number }> {
  await requireAllowance(userId);
  const [row, ctx, posted] = await Promise.all([
    loadRow(db, userId),
    loadUserContext(db, userId),
    db
      .from("drafts")
      .select("ai_body, body")
      .eq("user_id", userId)
      .eq("kind", "post")
      .eq("status", "posted")
      .not("ai_body", "is", null)
      .order("posted_at", { ascending: false })
      .limit(10),
  ]);

  const pairs = (posted.data ?? [])
    .filter((d) => d.ai_body && d.ai_body.trim() !== d.body.trim())
    .slice(0, 5)
    .map((d) => ({ drafted: d.ai_body as string, posted: d.body }));
  const samples = row?.sample_posts ?? [];
  if (!samples.length && !pairs.length) return { learned: 0 };

  const muted = row?.muted ?? [];
  const removed = muted.filter((k) => k.startsWith("ai:")).map((k) => k.slice(3).replace(/-/g, " "));
  const result = await learnVoice({ samples, pairs, removed, rules: ctx.rules, onUsage: usageRecorderFor(userId) });

  const mutedKeys = new Set(muted);
  const learned: Note[] = result.notes
    .map((text) => ({ key: learnedKey(text), text, source: "learned" as const }))
    .filter((n) => !mutedKeys.has(n.key));
  const own = (row?.notes ?? []).filter((n) => n.source === "you");
  const stats = readStats(row?.edit_stats);

  const { error } = await db.from("voice_profiles").upsert({
    user_id: userId,
    summary: result.summary,
    notes: [...own, ...learned],
    edit_stats: { ...stats, pairsSinceRefresh: 0 },
    refreshed_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Could not save your style notebook: ${error.message}`);
  return { learned: learned.length };
}

/** Runs a refresh in the background and swallows failures (allowance used up, AI unavailable). */
export async function refreshQuietly(db: Db, userId: string) {
  try {
    await refreshNotebook(db, userId);
  } catch (error) {
    console.error("style notebook refresh skipped:", error instanceof Error ? error.message : error);
  }
}
