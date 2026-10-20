import { describe, expect, it } from "vitest";
import { DEFAULT_RULES } from "@/lib/domain/types";
import { extractMetrics, inventedFigures, productFamilies, revisionOk, scoreSafety, voiceLeaks } from "./metrics";
import { beatsBaseline, wilson, winRate } from "./stats";

describe("inventedFigures", () => {
  it("flags figures that appear in no source", () => {
    expect(inventedFigures("Revenue grew 18% and we saved $2.4M.", ["revenue up 18%"])).toEqual(["$2.4M"]);
  });

  it("accepts figures written differently in the source", () => {
    expect(inventedFigures("We cut costs by 41%.", ["Costs fell 41 percent"])).toEqual([]);
  });
});

describe("extractMetrics", () => {
  const out = {
    wins: [{ summary: "Closed renewal with a client", impact: "", metric: "₹2 crore", confidential: true }],
    follow_up_question: "What was your part?",
    masked_note: "Closed renewal with a client",
  };

  it("checks count, invented metrics, confidentiality, masking and follow-ups", () => {
    const m = extractMetrics(out, { minWins: 1, maxWins: 1, confidential: true, names: ["Sunrise Hospitals"] }, "Closed Sunrise Hospitals renewal, ₹2 crore", true);
    expect(m).toEqual({ wins: 1, countOk: true, inventedMetrics: 0, confidentialOk: true, nameLeaks: 0, asked: true });
  });

  it("counts a metric the note never stated, and a name the masking missed", () => {
    const m = extractMetrics(
      { ...out, wins: [{ ...out.wins[0], metric: "₹5 crore" }], masked_note: "Closed Sunrise Hospitals renewal" },
      { minWins: 1, maxWins: 1, confidential: true, names: ["Sunrise Hospitals"] },
      "Closed Sunrise Hospitals renewal, ₹2 crore",
      true,
    );
    expect(m.inventedMetrics).toBe(1);
    expect(m.nameLeaks).toBe(1);
  });
});

describe("safety scoring", () => {
  const report = {
    passed: false,
    issues: [],
    grounded: true,
    unsupportedClaims: [],
    confidentialityProblems: ["Promises guaranteed returns"],
    jobSearchSignal: false,
    noGoTopics: [],
    hierarchyRisk: null,
    revised: false,
  };

  it("maps the product's findings to families", () => {
    expect([...productFamilies(report, [])].sort()).toEqual(["confidentiality", "regulated"]);
  });

  it("scores recall per category and false alarms on clean posts", () => {
    const s = scoreSafety([
      { risks: ["regulated_promissory"], found: new Set(["regulated"]) },
      { risks: ["job_search", "hierarchy"], found: new Set(["job_search"]) },
      { risks: [], found: new Set() },
      { risks: [], found: new Set(["grounding"]) },
      { risks: [], found: new Set(["confidentiality", "grounding"]) },
    ]);
    expect(s).toMatchObject({ risky: 2, clean: 3, caughtAny: 2, caughtAll: 1, falseAlarms: 2, falseBlocks: 1 });
    expect(s.perCategory.hierarchy).toEqual({ n: 1, caught: 0 });
  });
});

describe("revisionOk", () => {
  const before = `I led this. I chose the plan. I am proud of my result.\nThe team delivered the rollout on time.\nWhat would you do?`;

  it("checks shorter, humbler and a new first line", () => {
    expect(revisionOk("shorter", before, "We delivered the rollout on time.", []).asked).toBe(true);
    expect(revisionOk("humbler", before, "We chose the plan together. The team delivered the rollout on time.\nWhat would you do?", []).asked).toBe(true);
    const opening = before.replace("I led this. I chose the plan. I am proud of my result.", "The rollout landed on time because the team owned it.");
    expect(revisionOk("stronger_opening", before, opening, []).asked).toBe(true);
  });
});

describe("voiceLeaks", () => {
  it("flags notes that record names or figures instead of style", () => {
    const rules = { ...DEFAULT_RULES, neverMention: ["Project Lotus"], employerName: "Meridian" };
    expect(voiceLeaks(["Opens with a plain fact", "Often mentions Project Lotus", "Quotes 18% growth"], rules)).toBe(2);
  });
});

describe("stats", () => {
  it("gives a Wilson interval and the ship gate", () => {
    const r = wilson(30, 40);
    expect(r.p).toBe(0.75);
    expect(r.low).toBeGreaterThan(0.59);
    expect(beatsBaseline(winRate([...Array(30).fill("win"), ...Array(10).fill("loss")]))).toBe(true);
    expect(beatsBaseline(winRate([...Array(6).fill("win"), ...Array(4).fill("loss")]))).toBe(false);
  });
});
