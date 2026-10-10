"use server";

import { z } from "zod";
import { friendlyAiError } from "@/lib/ai/errors";
import { draftComments } from "@/lib/ai/tasks";
import { loadUserContext } from "@/lib/data/context";
import { requireUser } from "@/lib/data/session";
import { usageRecorderFor } from "@/lib/data/usage";

export interface CommentState {
  status: "idle" | "done" | "error";
  message?: string;
  options?: { approach: string; text: string; warnings: string[] }[];
}

const PostTextSchema = z.string().trim().min(20, "Paste the post you want to comment on.").max(6000, "That post is too long.");

export async function suggestComments(_prev: CommentState, formData: FormData): Promise<CommentState> {
  const { supabase, user } = await requireUser();
  const postText = PostTextSchema.safeParse(formData.get("postText"));
  if (!postText.success) return { status: "error", message: postText.error.issues[0]?.message };

  try {
    const ctx = await loadUserContext(supabase, user.id);
    const options = await draftComments({ postText: postText.data, ctx, onUsage: usageRecorderFor(user.id) });
    return {
      status: "done",
      options: options.map((o) => ({ approach: o.approach, text: o.text, warnings: o.issues.map((i) => i.message) })),
    };
  } catch (error) {
    return { status: "error", message: friendlyAiError(error) };
  }
}
