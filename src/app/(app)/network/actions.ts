"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { friendlyAiError } from "@/lib/ai/errors";
import { draftOutreach, suggestNetwork } from "@/lib/ai/network";
import { requireAllowance } from "@/lib/billing/allowance";
import { WIN_COLUMNS, loadUserContext, toWin, type WinRow } from "@/lib/data/context";
import { CONTACT_COLUMNS, loadGoals, type ContactRow } from "@/lib/data/network";
import { requireUser } from "@/lib/data/session";
import { usageRecorderFor } from "@/lib/data/usage";
import type { Db } from "@/lib/db/query";
import { firmById } from "@/lib/network/firms";
import { goalsToRow, parseGoalsForm, type NetworkGoals } from "@/lib/network/goals";
import { safeWebUrl } from "@/lib/network/links";
import {
  CHANNELS,
  CONTACT_STAGES,
  INTERACTION_KINDS,
  NETWORK_KINDS,
  OUTREACH_PURPOSES,
  ROLE_STAGES,
  stageAfter,
  type InteractionKind,
} from "@/lib/network/taxonomy";
import { addDays, localParts } from "@/lib/schedule/time";

export interface FormState {
  status: "idle" | "saved" | "error";
  message?: string;
  /** What the user typed, so a form that failed to save can show it again (React resets forms after an action). */
  values?: Record<string, string>;
}

/** The form's text values; a field with several values (checkboxes) comes back joined with "|". */
function typed(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of new Set(form.keys())) {
    if (key.startsWith("$")) continue;
    values[key] = form.getAll(key).filter((v): v is string => typeof v === "string").join("|");
  }
  return values;
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable();
const optionalDate = z.union([z.iso.date(), z.literal("")]).transform((v) => v || null);
const get = (form: FormData, key: string) => form.get(key) ?? "";

function revalidateNetwork(contactId?: string) {
  revalidatePath("/network");
  revalidatePath("/network/contacts");
  if (contactId) revalidatePath(`/network/contacts/${contactId}`);
}

async function recentWins(db: Db, userId: string) {
  const { data } = await db.from("wins").select(WIN_COLUMNS).eq("user_id", userId).order("occurred_on", { ascending: false }).limit(30);
  return ((data ?? []) as WinRow[]).map(toWin);
}

/** Companies and roles worth knowing, from the user's answers. Uses the plan's AI allowance. */
async function buildSuggestions(db: Db, userId: string, goals: NetworkGoals) {
  await requireAllowance(userId);
  const [ctx, wins] = await Promise.all([loadUserContext(db, userId), recentWins(db, userId)]);
  const map = await suggestNetwork({ goals, ctx, wins, onUsage: usageRecorderFor(userId) });
  const { error } = await db.from("network_suggestions").upsert({ user_id: userId, data: map, created_at: new Date().toISOString() });
  if (error) throw new Error(`Couldn't save suggestions: ${error.message}`);
}

/** Saves the setup answers, then builds the first suggestions of people to know. */
export async function saveGoals(_prev: FormState, form: FormData): Promise<FormState> {
  const { db, user } = await requireUser();
  const parsed = parseGoalsForm(form);
  if (!parsed.ok) return { status: "error", message: parsed.message, values: typed(form) };

  const { error } = await db.from("network_goals").upsert(goalsToRow(user.id, parsed.goals));
  if (error) return { status: "error", message: "Couldn't save your answers. Please try again.", values: typed(form) };

  let failed = false;
  try {
    await buildSuggestions(db, user.id, { ...parsed.goals, completedAt: null });
  } catch (err) {
    console.error("network suggestions:", friendlyAiError(err));
    failed = true;
  }
  revalidateNetwork();
  redirect(failed ? "/network?suggestions=failed" : "/network");
}

export async function refreshSuggestions(): Promise<FormState> {
  const { db, user } = await requireUser();
  const goals = await loadGoals(db, user.id);
  if (!goals) return { status: "error", message: "Answer the setup questions first." };
  try {
    await buildSuggestions(db, user.id, goals);
  } catch (err) {
    return { status: "error", message: friendlyAiError(err) };
  }
  revalidateNetwork();
  return { status: "saved" };
}

/** Adds a firm from the directory. The user finds the consultant who covers their area and names them. */
export async function addFirm(form: FormData) {
  const { db, user, profile } = await requireUser();
  const firm = firmById(String(get(form, "firmId")));
  if (!firm) return;
  const existing = await db.from("network_contacts").select("id").eq("user_id", user.id).eq("firm_id", firm.id).limit(1);
  if (existing.data?.length) return;
  await db.from("network_contacts").insert({
    user_id: user.id,
    kind: "search_firm",
    name: firm.name,
    unnamed: true,
    organisation: firm.name,
    firm_id: firm.id,
    next_step: "Find the consultant who covers your area",
    next_step_on: localParts(new Date(), profile.timezone).date,
  });
  revalidateNetwork();
  revalidatePath("/network/firms");
}

const SuggestedSchema = z.object({
  title: z.string().trim().min(1).max(160),
  organisation: z.string().trim().min(1).max(160),
  relation: z.enum(["competitor", "target", "adjacent"]),
});

/** Adds a suggested role at a company, to be named once the user finds the person. */
export async function addSuggestedPerson(form: FormData) {
  const { db, user, profile } = await requireUser();
  const parsed = SuggestedSchema.safeParse({ title: get(form, "title"), organisation: get(form, "organisation"), relation: get(form, "relation") });
  if (!parsed.success) return;
  const { title, organisation, relation } = parsed.data;
  const existing = await db
    .from("network_contacts")
    .select("id, title, organisation")
    .eq("user_id", user.id)
    .eq("unnamed", true)
    .eq("organisation", organisation);
  if (existing.data?.some((c) => c.title === title)) return;
  await db.from("network_contacts").insert({
    user_id: user.id,
    kind: relation === "competitor" ? "competitor" : "target_company",
    name: title,
    unnamed: true,
    title,
    organisation,
    next_step: "Find this person and add their name",
    next_step_on: localParts(new Date(), profile.timezone).date,
  });
  revalidateNetwork();
}

const ContactSchema = z.object({
  kind: z.enum(NETWORK_KINDS),
  name: z.string().trim().min(1, "Add their name.").max(120),
  title: text(160),
  organisation: text(160),
  email: z.union([z.email("That email address doesn't look right."), z.literal("")]).transform((v) => v || null),
  profileUrl: z.string().trim().max(500),
  howMet: text(200),
  notes: z.string().trim().max(4000),
});

function readContact(form: FormData) {
  return ContactSchema.safeParse({
    kind: get(form, "kind"),
    name: get(form, "name"),
    title: get(form, "title"),
    organisation: get(form, "organisation"),
    email: String(get(form, "email")).trim(),
    profileUrl: get(form, "profileUrl"),
    howMet: get(form, "howMet"),
    notes: get(form, "notes"),
  });
}

export async function addContact(_prev: FormState, form: FormData): Promise<FormState> {
  const { db, user } = await requireUser();
  const parsed = readContact(form);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, values: typed(form) };
  const profileUrl = safeWebUrl(parsed.data.profileUrl);
  if (parsed.data.profileUrl.trim() && !profileUrl) return { status: "error", message: "That link doesn't look like a web address.", values: typed(form) };

  const { data, error } = await db
    .from("network_contacts")
    .insert({
      user_id: user.id,
      kind: parsed.data.kind,
      name: parsed.data.name,
      title: parsed.data.title,
      organisation: parsed.data.organisation,
      email: parsed.data.email,
      profile_url: profileUrl,
      how_met: parsed.data.howMet,
      notes: parsed.data.notes,
    })
    .select("id")
    .single();
  if (error || !data) return { status: "error", message: "Couldn't save them. Please try again.", values: typed(form) };
  revalidateNetwork();
  redirect(`/network/contacts/${data.id}`);
}

export async function updateContact(_prev: FormState, form: FormData): Promise<FormState> {
  const { db, user } = await requireUser();
  const id = z.uuid().safeParse(form.get("id"));
  const stage = z.enum(CONTACT_STAGES).safeParse(form.get("stage"));
  if (!id.success || !stage.success) return { status: "error", message: "Something's missing. Reload and try again." };

  const current = await db.from("network_contacts").select("name, unnamed").eq("id", id.data).eq("user_id", user.id).maybeSingle();
  if (!current.data) return { status: "error", message: "That contact no longer exists." };
  // An unnamed contact keeps its placeholder until the user types a name.
  const typedName = String(get(form, "name")).trim();
  const parsed = readContact(withName(form, typedName || current.data.name));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, values: typed(form) };
  const profileUrl = safeWebUrl(parsed.data.profileUrl);
  if (parsed.data.profileUrl.trim() && !profileUrl) return { status: "error", message: "That link doesn't look like a web address.", values: typed(form) };

  const { error } = await db
    .from("network_contacts")
    .update({
      kind: parsed.data.kind,
      name: parsed.data.name,
      unnamed: current.data.unnamed && !typedName,
      title: parsed.data.title,
      organisation: parsed.data.organisation,
      email: parsed.data.email,
      profile_url: profileUrl,
      how_met: parsed.data.howMet,
      notes: parsed.data.notes,
      stage: stage.data,
    })
    .eq("id", id.data)
    .eq("user_id", user.id);
  if (error) return { status: "error", message: "Couldn't save the changes. Please try again.", values: typed(form) };
  revalidateNetwork(id.data);
  return { status: "saved", message: "Saved." };
}

function withName(form: FormData, name: string): FormData {
  const copy = new FormData();
  for (const [key, value] of form.entries()) copy.append(key, value);
  copy.set("name", name);
  return copy;
}

export async function deleteContact(form: FormData) {
  const { db, user } = await requireUser();
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return;
  await db.from("network_contacts").delete().eq("id", id.data).eq("user_id", user.id);
  revalidateNetwork();
  redirect("/network/contacts");
}

async function ownContact(db: Db, userId: string, id: unknown) {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return null;
  const { data } = await db.from("network_contacts").select(CONTACT_COLUMNS).eq("id", parsed.data).eq("user_id", userId).maybeSingle();
  return (data as ContactRow | null) ?? null;
}

/** Records a conversation step and moves the contact forward. */
async function recordInteraction(
  db: Db,
  userId: string,
  contact: ContactRow,
  entry: { kind: InteractionKind; summary: string; occurredOn: string },
  nextStep?: { text: string | null; on: string | null },
) {
  const { error } = await db.from("network_interactions").insert({
    user_id: userId,
    contact_id: contact.id,
    kind: entry.kind,
    summary: entry.summary,
    occurred_on: entry.occurredOn,
  });
  if (error) return false;
  const patch: Record<string, unknown> = { stage: stageAfter(contact.stage, entry.kind) };
  if (entry.kind !== "note" && (!contact.last_contact_on || entry.occurredOn > contact.last_contact_on)) {
    patch.last_contact_on = entry.occurredOn;
  }
  if (nextStep?.on) {
    patch.next_step = nextStep.text || "Follow up";
    patch.next_step_on = nextStep.on;
  }
  await db.from("network_contacts").update(patch).eq("id", contact.id).eq("user_id", userId);
  return true;
}

const InteractionSchema = z.object({
  kind: z.enum(INTERACTION_KINDS),
  summary: z.string().trim().min(2, "Add a line about what was said.").max(2000),
  occurredOn: z.iso.date(),
  nextStep: text(200),
  nextStepOn: optionalDate,
});

export async function logInteraction(_prev: FormState, form: FormData): Promise<FormState> {
  const { db, user, profile } = await requireUser();
  const contact = await ownContact(db, user.id, form.get("contactId"));
  if (!contact) return { status: "error", message: "That contact no longer exists." };
  const today = localParts(new Date(), profile.timezone).date;
  const parsed = InteractionSchema.safeParse({
    kind: get(form, "kind"),
    summary: get(form, "summary"),
    occurredOn: get(form, "occurredOn") || today,
    nextStep: get(form, "nextStep"),
    nextStepOn: get(form, "nextStepOn"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, values: typed(form) };
  if (parsed.data.occurredOn > today) return { status: "error", message: "That date is in the future.", values: typed(form) };

  const ok = await recordInteraction(db, user.id, contact, parsed.data, { text: parsed.data.nextStep, on: parsed.data.nextStepOn });
  if (!ok) return { status: "error", message: "Couldn't save it. Please try again." };
  revalidateNetwork(contact.id);
  return { status: "saved", message: "Logged." };
}

export async function deleteInteraction(form: FormData) {
  const { db, user } = await requireUser();
  const id = z.uuid().safeParse(form.get("id"));
  const contactId = z.uuid().safeParse(form.get("contactId"));
  if (!id.success || !contactId.success) return;
  await db.from("network_interactions").delete().eq("id", id.data).eq("user_id", user.id);
  revalidateNetwork(contactId.data);
}

export async function setNextStep(_prev: FormState, form: FormData): Promise<FormState> {
  const { db, user } = await requireUser();
  const contact = await ownContact(db, user.id, form.get("contactId"));
  if (!contact) return { status: "error", message: "That contact no longer exists." };
  const parsed = z
    .object({ nextStep: z.string().trim().min(2, "Say what the next step is.").max(200), nextStepOn: z.iso.date({ error: "Pick a date." }) })
    .safeParse({ nextStep: get(form, "nextStep"), nextStepOn: get(form, "nextStepOn") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, values: typed(form) };
  await db
    .from("network_contacts")
    .update({ next_step: parsed.data.nextStep, next_step_on: parsed.data.nextStepOn })
    .eq("id", contact.id)
    .eq("user_id", user.id);
  revalidateNetwork(contact.id);
  return { status: "saved", message: "Saved." };
}

export async function clearNextStep(form: FormData) {
  const { db, user } = await requireUser();
  const id = z.uuid().safeParse(form.get("contactId"));
  if (!id.success) return;
  await db.from("network_contacts").update({ next_step: null, next_step_on: null }).eq("id", id.data).eq("user_id", user.id);
  revalidateNetwork(id.data);
}

const RoleSchema = z.object({
  title: z.string().trim().min(2, "Add the role's title.").max(160),
  organisation: text(160),
  location: text(120),
  stage: z.enum(ROLE_STAGES),
  notes: z.string().trim().max(2000),
  contactId: z.union([z.uuid(), z.literal("")]).transform((v) => v || null),
});

export async function addRole(_prev: FormState, form: FormData): Promise<FormState> {
  const { db, user } = await requireUser();
  const parsed = RoleSchema.safeParse({
    title: get(form, "title"),
    organisation: get(form, "organisation"),
    location: get(form, "location"),
    stage: get(form, "stage") || "heard",
    notes: get(form, "notes"),
    contactId: get(form, "contactId"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, values: typed(form) };
  if (parsed.data.contactId && !(await ownContact(db, user.id, parsed.data.contactId))) {
    return { status: "error", message: "That contact no longer exists." };
  }
  const { error } = await db.from("network_roles").insert({
    user_id: user.id,
    contact_id: parsed.data.contactId,
    title: parsed.data.title,
    organisation: parsed.data.organisation,
    location: parsed.data.location,
    stage: parsed.data.stage,
    notes: parsed.data.notes,
  });
  if (error) return { status: "error", message: "Couldn't save the role. Please try again." };
  revalidatePath("/network/roles");
  revalidateNetwork(parsed.data.contactId ?? undefined);
  return { status: "saved", message: "Added." };
}

export async function updateRoleStage(form: FormData) {
  const { db, user } = await requireUser();
  const id = z.uuid().safeParse(form.get("id"));
  const stage = z.enum(ROLE_STAGES).safeParse(form.get("stage"));
  if (!id.success || !stage.success) return;
  await db.from("network_roles").update({ stage: stage.data }).eq("id", id.data).eq("user_id", user.id);
  revalidatePath("/network/roles");
  revalidatePath("/network");
}

export async function deleteRole(form: FormData) {
  const { db, user } = await requireUser();
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return;
  await db.from("network_roles").delete().eq("id", id.data).eq("user_id", user.id);
  revalidatePath("/network/roles");
  revalidatePath("/network");
}

export interface MessageState {
  status: "idle" | "done" | "error";
  message?: string;
  subject?: string | null;
  body?: string;
  note?: string;
  checks?: { message: string; blocking: boolean }[];
}

/** A private message for the user to send themselves, checked before it is shown. */
export async function draftMessage(_prev: MessageState, form: FormData): Promise<MessageState> {
  const { db, user } = await requireUser();
  const contact = await ownContact(db, user.id, form.get("contactId"));
  if (!contact) return { status: "error", message: "That contact no longer exists." };
  const purpose = z.enum(OUTREACH_PURPOSES).safeParse(form.get("purpose"));
  const channel = z.enum(CHANNELS).safeParse(form.get("channel"));
  if (!purpose.success || !channel.success) return { status: "error", message: "Choose what the message is for." };

  try {
    await requireAllowance(user.id);
    const [ctx, goals, wins, log] = await Promise.all([
      loadUserContext(db, user.id),
      loadGoals(db, user.id),
      recentWins(db, user.id),
      db
        .from("network_interactions")
        .select("kind, summary, occurred_on")
        .eq("contact_id", contact.id)
        .eq("user_id", user.id)
        .order("occurred_on", { ascending: false })
        .limit(6),
    ]);
    const draft = await draftOutreach({
      contact: {
        kind: contact.kind,
        name: contact.name,
        unnamed: contact.unnamed,
        title: contact.title,
        organisation: contact.organisation,
        howMet: contact.how_met,
        notes: contact.notes,
        stage: contact.stage,
      },
      interactions: (log.data ?? []).map((i) => ({ kind: i.kind, summary: i.summary, occurredOn: i.occurred_on })),
      purpose: purpose.data,
      channel: channel.data,
      goals,
      wins,
      ctx,
      onUsage: usageRecorderFor(user.id),
    });
    return {
      status: "done",
      subject: draft.subject,
      body: draft.body,
      note: draft.note,
      checks: draft.issues.map((i) => ({ message: i.message, blocking: i.severity === "error" })),
    };
  } catch (err) {
    return { status: "error", message: friendlyAiError(err) };
  }
}

/** The user says they sent it: logged, the contact moves forward, and a follow-up is set. */
export async function markSent(_prev: FormState, form: FormData): Promise<FormState> {
  const { db, user, profile } = await requireUser();
  const contact = await ownContact(db, user.id, form.get("contactId"));
  if (!contact) return { status: "error", message: "That contact no longer exists." };
  const body = String(get(form, "body")).trim();
  if (!body) return { status: "error", message: "There's no message to log." };
  const channel = z.enum(CHANNELS).catch("linkedin").parse(form.get("channel"));
  const today = localParts(new Date(), profile.timezone).date;
  const summary = `${channel === "email" ? "Email" : "LinkedIn message"}: ${body.replace(/\s+/g, " ").slice(0, 280)}${body.length > 280 ? "…" : ""}`;
  const ok = await recordInteraction(db, user.id, contact, { kind: "message_sent", summary, occurredOn: today }, {
    text: "Follow up if there's no reply",
    on: addDays(today, 7),
  });
  if (!ok) return { status: "error", message: "Couldn't log it. Please try again." };
  revalidateNetwork(contact.id);
  return { status: "saved", message: "Logged as sent. A follow-up is set for a week from today." };
}
