"use server";

import { z } from "zod";
import { friendlyAiError } from "@/lib/ai/errors";
import { requireAllowance } from "@/lib/billing/allowance";
import { commentStarters } from "@/lib/ai/tasks";
import { loadUserContext } from "@/lib/data/context";
import { requireUser } from "@/lib/data/session";
import { usageRecorderFor } from "@/lib/data/usage";

export interface StarterState {
  status: "idle" | "done" | "error";
  message?: string;
  starters?: { approach: string; starter: string; add: string; notes: string[] }[];
}

const PostTextSchema = z.string().trim().min(20, "Paste the post you want to comment on.").max(6000, "That post is too long.");

export async function suggestStarters(_prev: StarterState, formData: FormData): Promise<StarterState> {
  const { db, user } = await requireUser();
  const postText = PostTextSchema.safeParse(formData.get("postText"));
  if (!postText.success) return { status: "error", message: postText.error.issues[0]?.message };

  try {
    await requireAllowance(user.id);
    const ctx = await loadUserContext(db, user.id);
    const starters = await commentStarters({ postText: postText.data, ctx, onUsage: usageRecorderFor(user.id) });
    return {
      status: "done",
      starters: starters.map((s) => ({ approach: s.approach, starter: s.starter, add: s.add, notes: s.issues.map((i) => i.message) })),
    };
  } catch (error) {
    return { status: "error", message: friendlyAiError(error) };
  }
}
