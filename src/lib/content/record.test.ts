import { describe, expect, it } from "vitest";
import { groupRecord, nextWeekSuggestion, recordText, weekRows, type RecordWin } from "./record";

const win = (overrides: Partial<RecordWin>): RecordWin => ({
  occurred_on: "2026-10-12",
  summary: "Agreed the new pricing approach",
  impact: "",
  metric: null,
  pillar_id: null,
  confidential: false,
  kind: "result",
  ...overrides,
});

const pillars = [
  { id: "p1", name: "Pricing decisions" },
  { id: "p2", name: "Building teams" },
];

describe("groupRecord", () => {
  it("groups by topic in the user's order, results before lessons, and keeps praise apart", () => {
    const { groups, praise } = groupRecord(
      [
        win({ summary: "Lesson on discounts", kind: "lesson", pillar_id: "p1" }),
        win({ summary: "Cut discounting", kind: "result", pillar_id: "p1" }),
        win({ summary: "Hired two leads", pillar_id: "p2" }),
        win({ summary: "Fixed the CRM export" }),
        win({ summary: "CFO thanked the team", kind: "praise" }),
      ],
      pillars,
      { includeConfidential: true },
    );
    expect(groups.map((g) => g.title)).toEqual(["Pricing decisions", "Building teams", "Other work"]);
    expect(groups[0].wins.map((w) => w.summary)).toEqual(["Cut discounting", "Lesson on discounts"]);
    expect(praise.map((w) => w.summary)).toEqual(["CFO thanked the team"]);
  });

  it("can leave confidential wins out", () => {
    const { groups } = groupRecord([win({ confidential: true }), win({ summary: "Public win" })], pillars, {
      includeConfidential: false,
    });
    expect(groups.flatMap((g) => g.wins).map((w) => w.summary)).toEqual(["Public win"]);
  });
});

describe("recordText", () => {
  it("writes plain text that pastes into an appraisal form", () => {
    const { groups, praise } = groupRecord(
      [win({ metric: "about 20%", impact: "Protected margin", pillar_id: "p1" }), win({ summary: "Client praised the rollout", kind: "praise" })],
      pillars,
      { includeConfidential: true },
    );
    const text = recordText({
      title: "Your record",
      from: "2026-07-01",
      to: "2026-10-19",
      stats: { wins: 2, workdaysLogged: 30, postsPublished: 1, praise: 1, opportunities: 0 },
      groups,
      praise,
    });
    expect(text).toContain("Your record: 1 July 2026 – 19 October 2026");
    expect(text).toContain("2 wins · 30 workdays logged · 1 post published · 1 piece of praise · 0 opportunities");
    expect(text).toContain("- 12 Oct: Agreed the new pricing approach (about 20%)\n  Why it mattered: Protected margin");
    expect(text).toContain("What others said\n- 12 Oct: Client praised the rollout");
  });
});

describe("weekly scorecard", () => {
  const rows = weekRows("2026-10-21", 2, {
    entryDates: ["2026-10-19", "2026-10-20", "2026-10-14"],
    wins: [
      { occurred_on: "2026-10-19", kind: "result" },
      { occurred_on: "2026-10-20", kind: "praise" },
    ],
    postDates: ["2026-10-15"],
    opportunityDates: ["2026-10-20"],
  });

  it("counts this week from Monday up to today, then the week before", () => {
    expect(rows[0]).toEqual({ start: "2026-10-19", opportunities: 1, workdaysLogged: 2, workdays: 3, wins: 2, posts: 0, praise: 1 });
    expect(rows[1]).toMatchObject({ start: "2026-10-12", workdaysLogged: 1, workdays: 5, posts: 1 });
  });

  it("suggests one calm next step", () => {
    expect(nextWeekSuggestion(rows[0], 2, null)).toMatch(/2 drafts ready/);
    expect(nextWeekSuggestion(rows[0], 0, null)).toMatch(/Turn one of this week's wins/);
    expect(nextWeekSuggestion({ ...rows[1], wins: 0, posts: 0 }, 0, "finish my last meeting")).toMatch(/after you finish my last meeting/);
  });
});
