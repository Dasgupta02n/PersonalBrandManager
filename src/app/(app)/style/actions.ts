"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { friendlyAiError } from "@/lib/ai/errors";
import { requireUser } from "@/lib/data/session";
import { refreshNotebook } from "@/lib/voice/learn";
import type { Note } from "@/lib/voice/notebook";

export interface StyleState {
  status: "idle" | "done" | "error";
  message?: string;
}

async function loadNotebookRow() {
  const session = await requireUser();
  const { data } = await session.db
    .from("voice_profiles")
    .select("notes, muted")
    .eq("user_id", session.user.id)
    .maybeSingle();
  return { ...session, notes: ((data?.notes ?? []) as Note[]).filter(Boolean), muted: (data?.muted ?? []) as string[] };
}

const NoteSchema = z.string().trim().min(3, "Write a few words.").max(120, "Keep it under 120 characters.");

/** A note the user writes themselves, e.g. "Never use the word 'journey'". */
export async function addNote(_prev: StyleState, formData: FormData): Promise<StyleState> {
  const text = NoteSchema.safeParse(formData.get("note"));
  if (!text.success) return { status: "error", message: text.error.issues[0]?.message };
  const { db, user, notes } = await loadNotebookRow();
  if (notes.filter((n) => n.source === "you").length >= 20) return { status: "error", message: "That's the most notes you can add." };
  const { error } = await db
    .from("voice_profiles")
    .upsert({ user_id: user.id, notes: [...notes, { key: `you:${randomUUID()}`, text: text.data, source: "you" }] });
  if (error) return { status: "error", message: "Couldn't save it. Please try again." };
  revalidatePath("/style");
  return { status: "done" };
}

/** Removes a note. Learned ones are remembered as removed so they never come back. */
export async function removeNote(formData: FormData) {
  const key = z.string().min(3).max(200).safeParse(formData.get("key"));
  if (!key.success) return;
  const { db, user, notes, muted } = await loadNotebookRow();
  const patch = key.data.startsWith("you:")
    ? { notes: notes.filter((n) => n.key !== key.data) }
    : { notes: notes.filter((n) => n.key !== key.data), muted: [...new Set([...muted, key.data])] };
  await db.from("voice_profiles").upsert({ user_id: user.id, ...patch });
  revalidatePath("/style");
}

/** Reads the samples and recent edits again. Uses the plan's allowance. */
export async function learnAgain(): Promise<StyleState> {
  const { db, user } = await requireUser();
  try {
    const { learned } = await refreshNotebook(db, user.id);
    revalidatePath("/style");
    return learned
      ? { status: "done", message: `Updated: ${learned} ${learned === 1 ? "observation" : "observations"} from your writing.` }
      : { status: "done", message: "Nothing to learn from yet. Add sample posts in Settings, or post a draft you've edited." };
  } catch (error) {
    return { status: "error", message: friendlyAiError(error) };
  }
}

/** Forgets everything learned. Keeps the user's own notes and sample posts. */
export async function clearLearned() {
  const { db, user, notes } = await loadNotebookRow();
  await db.from("voice_profiles").upsert({
    user_id: user.id,
    summary: "",
    notes: notes.filter((n) => n.source === "you"),
    muted: [],
    edit_stats: {},
    refreshed_at: null,
  });
  revalidatePath("/style");
}
