import "server-only";
import type { NetworkMap } from "@/lib/ai/network";
import type { Db } from "@/lib/db/query";
import { goalsFromRow, type NetworkGoals } from "@/lib/network/goals";
import type { ContactStage, NetworkKind } from "@/lib/network/taxonomy";

export interface ContactRow {
  id: string;
  kind: NetworkKind;
  name: string;
  unnamed: boolean;
  title: string | null;
  organisation: string | null;
  firm_id: string | null;
  email: string | null;
  profile_url: string | null;
  how_met: string | null;
  notes: string;
  stage: ContactStage;
  next_step: string | null;
  next_step_on: string | null;
  last_contact_on: string | null;
  updated_at: string;
}

export const CONTACT_COLUMNS =
  "id, kind, name, unnamed, title, organisation, firm_id, email, profile_url, how_met, notes, stage, next_step, next_step_on, last_contact_on, updated_at";

export async function loadGoals(db: Db, userId: string): Promise<NetworkGoals | null> {
  const { data } = await db.from("network_goals").select("*").eq("user_id", userId).maybeSingle();
  return goalsFromRow(data);
}

export async function loadSuggestions(db: Db, userId: string): Promise<(NetworkMap & { createdAt: string }) | null> {
  const { data } = await db.from("network_suggestions").select("data, created_at").eq("user_id", userId).maybeSingle();
  if (!data?.data?.companies) return null;
  return { companies: data.data.companies, approach: data.data.approach ?? [], createdAt: data.created_at };
}

/** "Chief Risk Officer at Northbank", or as much of it as is known. */
export function roleLine(contact: Pick<ContactRow, "title" | "organisation" | "unnamed" | "name">): string {
  if (contact.unnamed) return contact.organisation && contact.organisation !== contact.name ? contact.organisation : "";
  return [contact.title, contact.organisation].filter(Boolean).join(" at ");
}
