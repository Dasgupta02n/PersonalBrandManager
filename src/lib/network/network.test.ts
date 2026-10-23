import { describe, expect, it } from "vitest";
import { DEFAULT_RULES } from "@/lib/domain/types";
import { filterFirms, joinAnd, matchFirms, type Firm } from "./firms";
import { parseGoalsForm, splitList } from "./goals";
import { linkedinPeopleSearch, mailtoLink, safeWebUrl } from "./links";
import { checkMessage, fillName, firstNameOf, maskName } from "./message";
import { stageAfter } from "./taxonomy";

const firm = (over: Partial<Firm>): Firm => ({
  id: "x",
  name: "X",
  website: "https://x.example",
  kind: "search_and_recruitment",
  markets: [],
  sectors: [],
  functions: [],
  seniority: [],
  source: "https://x.example/offices",
  checked: "2026-10-23",
  ...over,
});

const FIRMS = [
  firm({ id: "gulf", name: "Gulf Search", kind: "retained", markets: ["AE"], sectors: ["financial_services"], functions: ["finance"], seniority: ["cxo", "board"] }),
  firm({ id: "india", name: "India Talent", markets: ["IN"], sectors: ["financial_services"], functions: ["finance"], seniority: ["vp_director"] }),
  firm({ id: "global", name: "Global Partners", kind: "retained", markets: ["AE", "GB", "IN"], sectors: ["technology"], functions: ["technology"], seniority: ["cxo"] }),
];

describe("matchFirms", () => {
  const goals = { markets: ["AE" as const], sectors: ["financial_services" as const], functions: ["finance" as const], seniority: "cxo" as const };

  it("keeps only firms with an office where the user would work, best fit first", () => {
    const matches = matchFirms(goals, FIRMS);
    expect(matches.map((m) => m.firm.id)).toEqual(["gulf", "global"]);
  });

  it("explains each match in the user's terms", () => {
    const [best] = matchFirms(goals, FIRMS);
    expect(best.reasons).toEqual(["Office in the UAE", "Financial services practice", "Covers finance roles", "CXO searches"]);
  });

  it("can rank every firm, for the directory", () => {
    expect(matchFirms(goals, FIRMS, { requireMarket: false }).map((m) => m.firm.id)).toEqual(["gulf", "india", "global"]);
  });

  it("lists every firm when no market is chosen", () => {
    expect(matchFirms({ markets: [], sectors: [], functions: [], seniority: null }, FIRMS)).toHaveLength(3);
  });

  it("joins lists in plain English", () => {
    expect(joinAnd(["India", "the UAE", "the UK"])).toBe("India, the UAE and the UK");
  });
});

describe("filterFirms", () => {
  it("applies every filter at once, with a name search", () => {
    expect(filterFirms(FIRMS, { market: "IN", sector: "technology" }).map((f) => f.id)).toEqual(["global"]);
    expect(filterFirms(FIRMS, { q: "gulf" }).map((f) => f.id)).toEqual(["gulf"]);
  });
});

describe("setup answers", () => {
  it("splits lists, removing duplicates and blanks", () => {
    expect(splitList("Acme, acme ;Globex\n\n Initech ", 8)).toEqual(["Acme", "Globex", "Initech"]);
    expect(splitList("a,b,c,d", 2)).toEqual(["a", "b"]);
  });

  it("reads the form and ignores values outside the lists", () => {
    const form = new FormData();
    form.set("targetRoles", "Chief Risk Officer");
    form.append("functions", "risk");
    form.append("functions", "astrology");
    form.append("sectors", "financial_services");
    form.set("seniority", "cxo");
    form.append("markets", "AE");
    form.append("markets", "FR");
    form.set("competitors", "Northbank, Eastbank");
    const result = parseGoalsForm(form);
    expect(result.ok && result.goals.functions).toEqual(["risk"]);
    expect(result.ok && result.goals.markets).toEqual(["AE"]);
    expect(result.ok && result.goals.competitors).toEqual(["Northbank", "Eastbank"]);
    expect(result.ok && result.goals.timeline).toBe("ready");
  });

  it("asks for what the first suggestions need", () => {
    const result = parseGoalsForm(new FormData());
    expect(result).toEqual({ ok: false, message: "Add the role you'd want next, even roughly." });
  });
});

describe("links the user opens", () => {
  it("builds a LinkedIn people search", () => {
    expect(linkedinPeopleSearch("Chief  Risk Officer Northbank")).toBe(
      "https://www.linkedin.com/search/results/people/?keywords=Chief%20Risk%20Officer%20Northbank",
    );
  });

  it("only keeps plain web addresses", () => {
    expect(safeWebUrl("linkedin.com/in/someone")).toBe("https://linkedin.com/in/someone");
    expect(safeWebUrl("javascript:alert(1)")).toBeNull();
    expect(safeWebUrl("")).toBeNull();
  });

  it("fills an email draft for the user's mail app", () => {
    expect(mailtoLink("a@b.com", "Hello", "Line one\nLine two")).toBe("mailto:a@b.com?subject=Hello&body=Line%20one%0ALine%20two");
  });
});

describe("private messages", () => {
  const rules = { ...DEFAULT_RULES, employerName: "Northbank", neverMention: ["Project Falcon"] };

  it("allows naming your own employer, but never a never-mention term", () => {
    const issues = checkMessage("I lead risk at Northbank and ran Project Falcon.", { rules, kind: "competitor" });
    expect(issues.map((i) => i.code)).toEqual(["never_mention"]);
  });

  it("lets you tell a search consultant you're open to a move, and flags it to anyone else", () => {
    const text = "I'm open to new opportunities in the region.";
    expect(checkMessage(text, { rules, kind: "search_firm" })).toEqual([]);
    const [issue] = checkMessage(text, { rules, kind: "competitor" });
    expect(issue.code).toBe("job_search");
    expect(issue.severity).toBe("warning");
  });

  it("keeps the contact's name away from the model and puts it back afterwards", () => {
    expect(maskName("Met Priya Raman at the summit; Priya leads credit.", "Priya Raman")).toBe(
      "Met {first_name} at the summit; {first_name} leads credit.",
    );
    expect(fillName("Hi {first_name},", firstNameOf("Priya Raman"))).toBe("Hi Priya,");
    expect(fillName("Hi {first_name},", null)).toBe("Hi there,");
  });
});

describe("stageAfter", () => {
  it("moves a contact forward, never back", () => {
    expect(stageAfter("to_contact", "message_sent")).toBe("contacted");
    expect(stageAfter("contacted", "call")).toBe("in_conversation");
    expect(stageAfter("warm", "message_sent")).toBe("warm");
    expect(stageAfter("dormant", "message_received")).toBe("in_conversation");
    expect(stageAfter("contacted", "note")).toBe("contacted");
  });
});

describe("dates", () => {
  it("labels next steps plainly", async () => {
    const { dueLabel, dayLabel } = await import("./dates");
    expect(dueLabel("2026-10-23", "2026-10-23")).toEqual({ text: "Today", overdue: false });
    expect(dueLabel("2026-10-24", "2026-10-23").text).toBe("Tomorrow");
    expect(dueLabel("2026-10-20", "2026-10-23")).toEqual({ text: "Overdue · Tue 20 Oct", overdue: true });
    expect(dueLabel("2026-10-29", "2026-10-23").text).toBe("Thu 29 Oct");
    expect(dayLabel("2025-12-01", "2026-10-23")).toBe("1 Dec 2025");
  });
});
