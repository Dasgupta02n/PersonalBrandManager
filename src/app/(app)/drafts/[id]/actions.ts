"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { friendlyAiError } from "@/lib/ai/errors";
import { requireAllowance } from "@/lib/billing/allowance";
import { normalizeReport, recheckPost, revisePost, type GuardrailReport, type RevisionMode } from "@/lib/ai/tasks";
import { loadUserContext, toWin, WIN_COLUMNS, type WinRow } from "@/lib/data/context";
import { requireUser } from "@/lib/data/session";
import { usageRecorderFor } from "@/lib/data/usage";
import { checkText } from "@/lib/guardrails/check";
import { REFRESH_AFTER_EDITS, recordEdit, recordRevision, refreshQuietly } from "@/lib/voice/learn";

type Session = Awaited<ReturnType<typeof requireUser>>;

export interface SaveState {
  status: "idle" | "saved" | "error";
  message?: string;
}

const BodySchema = z.string().trim().min(1, "The post is empty.").max(3000, "LinkedIn posts are limited to 3,000 characters.");

async function loadDraft({ supabase, user }: Session, draftId: string) {
  const { data } = await supabase
    .from("drafts")
    .select("id, body, status, guardrails, source_win_ids")
    .eq("id", draftId)
    .eq("user_id", user.id)
    .eq("kind", "post")
    .maybeSingle();
  return data;
}

async function loadFacts({ supabase, user }: Session, winIds: string[]) {
  if (!winIds.length) return [];
  const { data } = await supabase.from("wins").select(WIN_COLUMNS).eq("user_id", user.id).in("id", winIds);
  return ((data ?? []) as WinRow[]).map(toWin);
}

function statusFor(current: string, report: GuardrailReport) {
  if (current === "posted") return "posted";
  return report.passed ? "ready" : "draft";
}

function refresh(draftId: string) {
  revalidatePath(`/drafts/${draftId}`);
  revalidatePath("/drafts");
}

/** Saves the user's edits and re-runs the instant checks. The AI checks are marked out of date. */
export async function saveDraft(draftId: string, _prev: SaveState, formData: FormData): Promise<SaveState> {
  const session = await requireUser();
  const body = BodySchema.safeParse(formData.get("body"));
  if (!body.success) return { status: "error", message: body.error.issues[0]?.message };

  const existing = await loadDraft(session, draftId);
  if (!existing) return { status: "error", message: "Draft not found." };

  const ctx = await loadUserContext(session.supabase, session.user.id);
  const check = checkText(body.data, { kind: "post", rules: ctx.rules, avoidWords: ctx.voice.avoidWords });
  const previous = normalizeReport(existing.guardrails as Partial<GuardrailReport>);
  const report: GuardrailReport = {
    ...(previous ?? normalizeReport({ passed: true })!),
    passed: check.passed,
    issues: check.issues,
    aiStale: body.data !== existing.body || (previous?.aiStale ?? false),
  };

  const { error } = await session.supabase
    .from("drafts")
    .update({ body: body.data, guardrails: report, status: statusFor(existing.status, report) })
    .eq("id", draftId)
    .eq("user_id", session.user.id);
  if (error) return { status: "error", message: "Couldn't save. Please try again; your text is still here." };

  refresh(draftId);
  return { status: "saved", message: "Saved." };
}

export interface CheckState {
  status: "idle" | "done" | "error";
  message?: string;
  suggestedBody?: string | null;
}

/** Runs the full AI review on the user's own text without rewriting it. */
export async function recheckDraft(draftId: string): Promise<CheckState> {
  const session = await requireUser();
  const draft = await loadDraft(session, draftId);
  if (!draft) return { status: "error", message: "Draft not found." };

  try {
    await requireAllowance(session.user.id);
    const ctx = await loadUserContext(session.supabase, session.user.id);
    const facts = await loadFacts(session, draft.source_win_ids);
    const result = await recheckPost({ body: draft.body, facts, ctx, onUsage: usageRecorderFor(session.user.id) });
    await session.supabase
      .from("drafts")
      .update({ guardrails: result.report, status: statusFor(draft.status, result.report) })
      .eq("id", draftId)
      .eq("user_id", session.user.id);
    refresh(draftId);
    return { status: "done", suggestedBody: result.suggestedBody };
  } catch (error) {
    return { status: "error", message: friendlyAiError(error) };
  }
}

const ModeSchema = z.enum(["shorter", "humbler", "stronger_opening"]);

/** One-tap revision, followed by the full review. */
export async function reviseDraft(draftId: string, _prev: CheckState, formData: FormData): Promise<CheckState> {
  const session = await requireUser();
  const mode = ModeSchema.safeParse(formData.get("mode"));
  if (!mode.success) return { status: "error", message: "Unknown revision." };
  const draft = await loadDraft(session, draftId);
  if (!draft) return { status: "error", message: "Draft not found." };

  try {
    await requireAllowance(session.user.id);
    const ctx = await loadUserContext(session.supabase, session.user.id);
    const facts = await loadFacts(session, draft.source_win_ids);
    const result = await revisePost({
      body: draft.body,
      mode: mode.data as RevisionMode,
      facts,
      ctx,
      onUsage: usageRecorderFor(session.user.id),
    });
    await session.supabase
      .from("drafts")
      .update({ body: result.body, ai_body: result.body, guardrails: result.report, status: statusFor(draft.status, result.report) })
      .eq("id", draftId)
      .eq("user_id", session.user.id);
    await recordRevision(session.supabase, session.user.id, mode.data);
    refresh(draftId);
    return { status: "done" };
  } catch (error) {
    return { status: "error", message: friendlyAiError(error) };
  }
}

const PostUrlSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https:\/\/(www\.)?linkedin\.com\//.test(v), "Paste a linkedin.com link, or leave it empty.");

/** Marks the draft posted and learns from what the user changed before posting it. */
export async function markPosted(draftId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const url = PostUrlSchema.safeParse(formData.get("postUrl") ?? "");
  const { data: draft } = await supabase
    .from("drafts")
    .update({ status: "posted", posted_at: new Date().toISOString(), post_url: url.success && url.data ? url.data : null })
    .eq("id", draftId)
    .eq("user_id", user.id)
    .select("ai_body, body")
    .maybeSingle();
  if (draft?.ai_body) {
    const stats = await recordEdit(supabase, user.id, draft.ai_body, draft.body);
    if (stats && stats.pairsSinceRefresh >= REFRESH_AFTER_EDITS) after(() => refreshQuietly(supabase, user.id));
  }
  refresh(draftId);
}

/** Undo for "Mark as posted". */
export async function unmarkPosted(draftId: string) {
  const session = await requireUser();
  const draft = await loadDraft(session, draftId);
  if (!draft) return;
  const report = normalizeReport(draft.guardrails as Partial<GuardrailReport>);
  await session.supabase
    .from("drafts")
    .update({ status: report?.passed ? "ready" : "draft", posted_at: null, post_url: null })
    .eq("id", draftId)
    .eq("user_id", session.user.id);
  refresh(draftId);
}

export async function discardDraft(draftId: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("drafts").update({ status: "discarded" }).eq("id", draftId).eq("user_id", user.id);
  revalidatePath("/drafts");
  redirect("/drafts");
}
