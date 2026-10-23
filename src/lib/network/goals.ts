import { z } from "zod";
import {
  FUNCTIONS,
  MARKETS,
  SECTORS,
  SENIORITY,
  TIMELINES,
  type Func,
  type Market,
  type Sector,
  type Seniority,
  type Timeline,
} from "./taxonomy";

/** The user's answers to the Network setup questions. */
export interface NetworkGoals {
  targetRoles: string[];
  functions: Func[];
  sectors: Sector[];
  seniority: Seniority | null;
  markets: Market[];
  cities: string[];
  currentCompany: string | null;
  competitors: string[];
  targetCompanies: string[];
  timeline: Timeline;
  offer: string;
  completedAt: string | null;
}

/** "Acme, Globex; Initech" → ["Acme", "Globex", "Initech"]: trimmed, de-duplicated, capped. */
export function splitList(value: unknown, max: number, maxLength = 80): string[] {
  if (typeof value !== "string") return [];
  const seen = new Set<string>();
  const items: string[] = [];
  for (const raw of value.split(/[,;\n]/)) {
    const item = raw.replace(/\s+/g, " ").trim().slice(0, maxLength);
    const key = item.toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    items.push(item);
    if (items.length === max) break;
  }
  return items;
}

const pick = <T extends string>(allowed: readonly T[], values: unknown[]) =>
  [...new Set(values.filter((v): v is T => typeof v === "string" && (allowed as readonly string[]).includes(v)))];

const GoalsSchema = z.object({
  targetRoles: z.array(z.string()).min(1, "Add the role you'd want next, even roughly."),
  functions: z.array(z.enum(FUNCTIONS)).min(1, "Choose at least one function."),
  sectors: z.array(z.enum(SECTORS)).min(1, "Choose at least one sector."),
  seniority: z.enum(SENIORITY, { error: "Choose the level you're aiming for." }),
  markets: z.array(z.enum(MARKETS)).min(1, "Choose at least one place you'd work."),
  cities: z.array(z.string()),
  currentCompany: z.string().max(120).nullable(),
  competitors: z.array(z.string()),
  targetCompanies: z.array(z.string()),
  timeline: z.enum(TIMELINES),
  offer: z.string().max(300),
});

/** Reads and checks the setup form. */
export function parseGoalsForm(form: FormData): { ok: true; goals: Omit<NetworkGoals, "completedAt"> } | { ok: false; message: string } {
  const parsed = GoalsSchema.safeParse({
    targetRoles: splitList(form.get("targetRoles"), 3, 100),
    functions: pick(FUNCTIONS, form.getAll("functions")),
    sectors: pick(SECTORS, form.getAll("sectors")),
    seniority: form.get("seniority") || undefined,
    markets: pick(MARKETS, form.getAll("markets")),
    cities: splitList(form.get("cities"), 6, 60),
    currentCompany: String(form.get("currentCompany") ?? "").trim().slice(0, 120) || null,
    competitors: splitList(form.get("competitors"), 8),
    targetCompanies: splitList(form.get("targetCompanies"), 8),
    timeline: form.get("timeline") || "ready",
    offer: String(form.get("offer") ?? "").trim().slice(0, 300),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your answers." };
  return { ok: true, goals: parsed.data };
}

/* eslint-disable @typescript-eslint/no-explicit-any -- a database row */
export function goalsFromRow(row: any): NetworkGoals | null {
  if (!row) return null;
  return {
    targetRoles: row.target_roles ?? [],
    functions: pick(FUNCTIONS, row.functions ?? []),
    sectors: pick(SECTORS, row.sectors ?? []),
    seniority: (SENIORITY as readonly string[]).includes(row.seniority) ? row.seniority : null,
    markets: pick(MARKETS, row.markets ?? []),
    cities: row.cities ?? [],
    currentCompany: row.current_company ?? null,
    competitors: row.competitors ?? [],
    targetCompanies: row.target_companies ?? [],
    timeline: (TIMELINES as readonly string[]).includes(row.timeline) ? row.timeline : "ready",
    offer: row.offer ?? "",
    completedAt: row.completed_at ?? null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function goalsToRow(userId: string, goals: Omit<NetworkGoals, "completedAt">) {
  return {
    user_id: userId,
    target_roles: goals.targetRoles,
    functions: goals.functions,
    sectors: goals.sectors,
    seniority: goals.seniority,
    markets: goals.markets,
    cities: goals.cities,
    current_company: goals.currentCompany,
    competitors: goals.competitors,
    target_companies: goals.targetCompanies,
    timeline: goals.timeline,
    offer: goals.offer,
    completed_at: new Date().toISOString(),
  };
}
