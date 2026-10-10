"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { GuardrailReport } from "@/lib/ai/tasks";
import { loadUserContext } from "@/lib/data/context";
import { requireUser } from "@/lib/data/session";
import { checkText } from "@/lib/guardrails/check";

export interface SaveState {
  status: "idle" | "saved" | "error";
  message?: string;
}

const BodySchema = z.string().trim().min(1, "The post is empty.").max(3000, "LinkedIn posts are limited to 3,000 characters.");

/** Saves the user's edits and re-runs the deterministic checks. */
export async function saveDraft(draftId: string, _prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, user } = await requireUser();
  const body = BodySchema.safeParse(formData.get("body"));
  if (!body.success) return { status: "error", message: body.error.issues[0]?.message };

  const { data: existing } = await supabase
    .from("drafts")
    .select("guardrails, status")
    .eq("id", draftId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) return { status: "error", message: "Draft not found." };

  const ctx = await loadUserContext(supabase, user.id);
  const check = checkText(body.data, { kind: "post", rules: ctx.rules });
  const previous = (existing.guardrails ?? {}) as Partial<GuardrailReport>;
  const report: GuardrailReport = {
    passed: check.passed,
    issues: check.issues,
    grounded: previous.grounded ?? true,
    unsupportedClaims: previous.unsupportedClaims ?? [],
    confidentialityProblems: previous.confidentialityProblems ?? [],
    jobSearchSignal: previous.jobSearchSignal ?? false,
    revised: previous.revised ?? false,
  };

  const { error } = await supabase
    .from("drafts")
    .update({
      body: body.data,
      guardrails: report,
      status: existing.status === "posted" ? "posted" : check.passed ? "ready" : "draft",
    })
    .eq("id", draftId)
    .eq("user_id", user.id);
  if (error) return { status: "error", message: "Could not save. Please try again." };

  revalidatePath(`/drafts/${draftId}`);
  revalidatePath("/drafts");
  return {
    status: "saved",
    message: check.passed ? "Saved. Checks passed." : "Saved, but some checks need attention.",
  };
}

const PostUrlSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https:\/\/(www\.)?linkedin\.com\//.test(v), "Paste a linkedin.com link, or leave it empty.");

export async function markPosted(draftId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const url = PostUrlSchema.safeParse(formData.get("postUrl") ?? "");
  await supabase
    .from("drafts")
    .update({
      status: "posted",
      posted_at: new Date().toISOString(),
      post_url: url.success && url.data ? url.data : null,
    })
    .eq("id", draftId)
    .eq("user_id", user.id);
  revalidatePath(`/drafts/${draftId}`);
  revalidatePath("/drafts");
}

export async function discardDraft(draftId: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("drafts").update({ status: "discarded" }).eq("id", draftId).eq("user_id", user.id);
  revalidatePath("/drafts");
  redirect("/drafts");
}
