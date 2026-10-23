import "server-only";
import type { UserContext, Win } from "@/lib/domain/types";
import type { GuardrailIssue } from "@/lib/guardrails/check";
import type { NetworkGoals } from "@/lib/network/goals";
import { linkedinPeopleSearch } from "@/lib/network/links";
import { checkMessage, fillName, firstNameOf, maskName, privateMessageRules } from "@/lib/network/message";
import {
  FUNCTION_LABEL,
  MARKET_LABEL,
  NETWORK_KIND_LABEL,
  OUTREACH_LABEL,
  SECTOR_LABEL,
  SENIORITY_LABEL,
  STAGE_LABEL,
  TIMELINE_LABEL,
  INTERACTION_LABEL,
  type Channel,
  type ContactStage,
  type InteractionKind,
  type NetworkKind,
  type OutreachPurpose,
} from "@/lib/network/taxonomy";
import { runStructured, type UsageRecorder } from "./client";
import { NETWORK_MAP_SYSTEM, OUTREACH_SYSTEM, formatUserContext, formatWins } from "./prompts";
import { NetworkMapSchema, OutreachSchema } from "./schemas";

/** The user's answers, as the model reads them. */
export function formatGoals(goals: NetworkGoals): string {
  const list = (items: string[]) => (items.length ? items.join(", ") : "(not given)");
  return `<user_data>
Role wanted next: ${list(goals.targetRoles)}
Function: ${list(goals.functions.map((f) => FUNCTION_LABEL[f]))}
Sectors: ${list(goals.sectors.map((s) => SECTOR_LABEL[s]))}
Level: ${goals.seniority ? SENIORITY_LABEL[goals.seniority] : "(not given)"}
Markets: ${list(goals.markets.map((m) => MARKET_LABEL[m]))}${goals.cities.length ? ` (cities: ${goals.cities.join(", ")})` : ""}
Current company: ${goals.currentCompany ?? "(not given)"}
Competitors: ${list(goals.competitors)}
Companies they would join: ${list(goals.targetCompanies)}
Timeline: ${TIMELINE_LABEL[goals.timeline]}
What they can offer others: ${goals.offer || "(not given)"}
</user_data>`;
}

export interface NetworkPerson {
  title: string;
  why: string;
  /** A LinkedIn people search the user can open themselves. */
  search: string;
}

export interface NetworkCompany {
  name: string;
  relation: "competitor" | "target" | "adjacent";
  why: string;
  people: NetworkPerson[];
}

export interface NetworkMap {
  companies: NetworkCompany[];
  approach: string[];
}

const same = (a: string, b: string | null | undefined) => !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Companies and roles worth knowing, from the user's answers: every company they named, then a few
 * the model is confident about. Titles only, never people. The user's own employer is dropped.
 */
export async function suggestNetwork(input: {
  goals: NetworkGoals;
  ctx: UserContext;
  wins: Win[];
  onUsage?: UsageRecorder;
}): Promise<NetworkMap> {
  const publicWins = input.wins.filter((w) => !w.confidential).slice(0, 12);
  const result = await runStructured({
    task: "network_map",
    system: NETWORK_MAP_SYSTEM,
    schema: NetworkMapSchema,
    onUsage: input.onUsage,
    prompt: `${formatGoals(input.goals)}

Their role today: ${input.ctx.headline ?? "(not set)"}
${formatWins(publicWins)}`,
  });

  const own = [input.goals.currentCompany, input.ctx.rules.employerName];
  const seen = new Set<string>();
  let adjacent = 0;
  const companies: NetworkCompany[] = [];
  for (const c of result.companies) {
    const name = c.name.trim().slice(0, 100);
    const key = name.toLowerCase();
    if (!name || seen.has(key) || own.some((o) => same(name, o))) continue;
    const named = [...input.goals.competitors, ...input.goals.targetCompanies].some((n) => same(name, n));
    const relation = named ? (input.goals.competitors.some((n) => same(name, n)) ? "competitor" : "target") : "adjacent";
    if (relation === "adjacent" && ++adjacent > 4) continue;
    seen.add(key);
    companies.push({
      name,
      relation,
      why: c.why.trim(),
      people: c.people
        .map((p) => ({ title: p.title.trim().slice(0, 100), why: p.why.trim() }))
        .filter((p) => p.title)
        .slice(0, 3)
        .map((p) => ({ ...p, search: linkedinPeopleSearch(`${p.title} ${name}`) })),
    });
  }
  return { companies, approach: result.approach.map((a) => a.trim()).filter(Boolean).slice(0, 3) };
}

export interface OutreachContact {
  kind: NetworkKind;
  name: string;
  unnamed: boolean;
  title: string | null;
  organisation: string | null;
  howMet: string | null;
  notes: string;
  stage: ContactStage;
}

export interface OutreachDraft {
  subject: string | null;
  body: string;
  note: string;
  issues: GuardrailIssue[];
}

/**
 * A private message for the user to send themselves. The contact's name never reaches the model:
 * it writes a placeholder, and the first name is put in afterwards. Checked before it is shown.
 */
export async function draftOutreach(input: {
  contact: OutreachContact;
  interactions: { kind: InteractionKind; summary: string; occurredOn: string }[];
  purpose: OutreachPurpose;
  channel: Channel;
  goals: NetworkGoals | null;
  wins: Win[];
  ctx: UserContext;
  onUsage?: UsageRecorder;
}): Promise<OutreachDraft> {
  const { contact } = input;
  const personName = contact.unnamed ? null : contact.name;
  const mask = (text: string) => maskName(text, personName);
  const log = input.interactions
    .slice(0, 6)
    .map((i) => `- ${i.occurredOn} · ${INTERACTION_LABEL[i.kind]}: ${mask(i.summary).slice(0, 400)}`)
    .join("\n");
  const ctx = { ...input.ctx, rules: privateMessageRules(input.ctx.rules) };

  const result = await runStructured({
    task: "outreach_message",
    system: OUTREACH_SYSTEM,
    schema: OutreachSchema,
    onUsage: input.onUsage,
    prompt: `${formatUserContext(ctx)}

${input.goals ? formatGoals(input.goals) : "The user hasn't answered the network questions."}

${formatWins(input.wins.filter((w) => !w.confidential).slice(0, 15))}

<contact>
Who: ${NETWORK_KIND_LABEL[contact.kind]}${contact.unnamed ? " (no named person yet)" : " ({first_name})"}
Their role: ${contact.title ?? "(not known)"}
Organisation: ${contact.organisation ?? (contact.unnamed ? contact.name : "(not known)")}
How the user knows them: ${contact.howMet ? mask(contact.howMet) : "(not given)"}
Stage: ${STAGE_LABEL[contact.stage]}
Notes: ${contact.notes ? mask(contact.notes).slice(0, 1500) : "(none)"}
Conversation log, newest first:
${log || "(nothing yet)"}
</contact>

Write ${input.channel === "email" ? "an email" : "a LinkedIn message"} to ${OUTREACH_LABEL[input.purpose].toLowerCase()} (${input.purpose}).`,
  });

  const firstName = firstNameOf(personName);
  const body = fillName(result.body.trim(), firstName);
  const subject = input.channel === "email" ? fillName(result.subject?.trim() || "", firstName) || null : null;
  return {
    subject,
    body,
    note: result.note.trim(),
    issues: checkMessage(`${subject ?? ""}\n${body}`, { rules: input.ctx.rules, kind: contact.kind, avoidWords: input.ctx.voice.avoidWords }),
  };
}
