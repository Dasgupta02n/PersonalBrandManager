import { describe, expect, it } from "vitest";
import { cosine, keywordScore, rankWins, terms, winText } from "./rank";

const win = (id: string, summary: string, embedding: number[] | null = null) => ({ id, summary, impact: "", skills: [], embedding });

describe("rankWins", () => {
  const wins = [
    win("a", "Cut vendor costs by renegotiating the cloud contract", [1, 0, 0]),
    win("b", "Coached two analysts through month-end close", [0, 1, 0]),
    win("c", "Aligned three directors on the migration plan", [0.7, 0.7, 0]),
  ];

  it("ranks by meaning when vectors are available", () => {
    const ranked = rankWins("savings", [1, 0.1, 0], wins);
    expect(ranked.map((r) => r.win.id)).toEqual(["a", "c"]);
  });

  it("falls back to shared words without vectors", () => {
    const ranked = rankWins("analysts coaching", null, wins.map((w) => ({ ...w, embedding: null })));
    expect(ranked.map((r) => r.win.id)).toEqual(["b"]);
  });

  it("drops weak matches", () => {
    expect(rankWins("board governance", null, wins)).toEqual([]);
  });
});

describe("helpers", () => {
  it("measure similarity and shared words", () => {
    expect(cosine([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
    expect(terms("The analysts and the analytics")).toEqual(["analys", "analyt"]);
    expect(terms("costs costing cost")).toEqual(["cost"]);
    expect(keywordScore(terms("vendor cost"), "Cut vendor costs")).toBe(1);
    expect(winText({ summary: "Led it.", impact: "Saved time.", skills: ["Leadership"] })).toBe("Led it. Saved time. Skills: Leadership");
  });
});
