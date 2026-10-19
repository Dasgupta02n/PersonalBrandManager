import { describe, expect, it } from "vitest";
import { loadRaw } from "./lib/load";
import { DATASETS, RISK_CATEGORIES, type DatasetName } from "./lib/schema";

// Validates the test sets: shape, consistency, balance, and that every name is fictional.
// A set that hasn't been written yet is skipped; set EVAL_REQUIRE_ALL=1 to require every one.

const load = loadRaw;

/** Real organisations must never appear: every person, employer and client is fictional. */
const REAL_NAMES = [
  "Google", "Microsoft", "Amazon", "Apple", "Meta", "Facebook", "Infosys", "Wipro", "Tata", "Reliance", "HDFC", "ICICI",
  "HSBC", "Barclays", "Lloyds", "JPMorgan", "J.P. Morgan", "Goldman", "Morgan Stanley", "Citi", "McKinsey", "Deloitte",
  "Accenture", "KPMG", "PwC", "EY", "Unilever", "Nestle", "Emirates", "Etisalat", "DBS", "OCBC", "Grab", "Salesforce",
  "Oracle", "IBM", "NHS England", "Pfizer", "Novartis", "Siemens", "Shell", "BP",
];

const personaIds = new Set(((load("personas") ?? []) as { id: string }[]).map((p) => p.id));

function textOf(value: unknown): string {
  return JSON.stringify(value);
}

describe.each(Object.keys(DATASETS) as DatasetName[])("test set: %s", (name) => {
  const rows = load(name);
  const required = process.env.EVAL_REQUIRE_ALL === "1";

  it.skipIf(!rows && !required)("exists and parses", () => {
    expect(rows, `${DATASETS[name].file} is missing`).not.toBeNull();
    const parsed = DATASETS[name].schema.array().safeParse(rows);
    if (!parsed.success) throw new Error(parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
  });

  // Sets are written in parts; the full size is required once every part is in.
  it.skipIf(!required)("has the committed size", () => {
    expect(rows?.length ?? 0).toBeGreaterThanOrEqual(DATASETS[name].size);
  });

  it.skipIf(!rows)("has unique ids that point at real personas", () => {
    const ids = rows!.map((r) => (r as { id: string }).id);
    expect(new Set(ids).size).toBe(ids.length);
    if (name !== "personas") {
      for (const row of rows! as { id: string; personaId: string }[]) expect(personaIds.has(row.personaId), `${row.id} → ${row.personaId}`).toBe(true);
    }
  });

  it.skipIf(!rows)("names no real organisation", () => {
    for (const row of rows!) {
      const text = textOf(row);
      for (const real of REAL_NAMES) {
        expect(new RegExp(`\\b${real.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text), `${(row as { id: string }).id} mentions ${real}`).toBe(false);
      }
    }
  });
});

describe.skipIf(process.env.EVAL_REQUIRE_ALL !== "1")("balance", () => {
  it.skipIf(!load("notes"))("notes: sensible expectations, with masking and follow-ups both covered", () => {
    const notes = load("notes") as { expect: { minWins: number; maxWins: number; names: string[]; followUpHelps: boolean; confidential: boolean } }[];
    for (const n of notes) expect(n.expect.minWins).toBeLessThanOrEqual(n.expect.maxWins);
    expect(notes.filter((n) => n.expect.names.length > 0).length).toBeGreaterThanOrEqual(40);
    expect(notes.filter((n) => n.expect.followUpHelps).length).toBeGreaterThanOrEqual(30);
    expect(notes.filter((n) => n.expect.confidential).length).toBeGreaterThanOrEqual(30);
    expect(notes.filter((n) => n.expect.maxWins === 0).length).toBeGreaterThanOrEqual(10);
  });

  it.skipIf(!load("risks"))("risks: every category at least 10 times, and at least 40 clean posts", () => {
    const risks = load("risks") as { risks: string[] }[];
    expect(risks.filter((r) => r.risks.length === 0).length).toBeGreaterThanOrEqual(40);
    for (const category of RISK_CATEGORIES) {
      expect(risks.filter((r) => r.risks.includes(category)).length, category).toBeGreaterThanOrEqual(10);
    }
  });

  it.skipIf(!load("reads"))("reads: each verdict at least 12 times", () => {
    const reads = load("reads") as { expected: string }[];
    for (const v of ["confident", "boastful", "too_modest", "generic"]) expect(reads.filter((r) => r.expected === v).length, v).toBeGreaterThanOrEqual(12);
  });

  it.skipIf(!load("revisions"))("revisions: each mode at least 15 times", () => {
    const revisions = load("revisions") as { mode: string }[];
    for (const m of ["shorter", "humbler", "stronger_opening"]) expect(revisions.filter((r) => r.mode === m).length, m).toBeGreaterThanOrEqual(15);
  });

  it.skipIf(!load("drafts"))("drafts: every persona and every format", () => {
    const drafts = load("drafts") as { personaId: string; format: string }[];
    for (const p of personaIds) expect(drafts.filter((d) => d.personaId === p).length, p).toBeGreaterThanOrEqual(15);
    for (const f of ["lesson", "decision", "credit", "how_to"]) expect(drafts.filter((d) => d.format === f).length, f).toBeGreaterThanOrEqual(50);
  });
});
