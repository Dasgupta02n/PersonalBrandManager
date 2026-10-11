import { describe, expect, it, vi } from "vitest";
import type { GuardrailReport } from "@/lib/ai/tasks";

vi.mock("server-only", () => ({}));

const { blockingIssues, checkNotes, safetyChecks, verdictLines } = await import("./verdict");

const base: GuardrailReport = {
  passed: true,
  issues: [],
  grounded: true,
  unsupportedClaims: [],
  confidentialityProblems: [],
  jobSearchSignal: false,
  noGoTopics: [],
  hierarchyRisk: null,
  revised: false,
  howItReads: { verdict: "confident", soundsLikeYou: true, readers: [], lines: [] },
};

describe("verdict", () => {
  it("states the full promise for a clean draft", () => {
    expect(verdictLines(base).map((l) => [l.state, l.label])).toEqual([
      ["ok", "Safe to post"],
      ["ok", "Reads as confident, not boastful"],
      ["ok", "Sounds like you"],
    ]);
    expect(safetyChecks(base).every((c) => c.passed)).toBe(true);
  });

  it("blocks on a named client until fixed", () => {
    const report = { ...base, passed: false, confidentialityProblems: ["Names the client Acme"] };
    expect(blockingIssues(report)).toEqual(["Confidentiality: Names the client Acme"]);
    expect(verdictLines(report)[0]).toMatchObject({ state: "block", label: "1 thing to fix before posting" });
    expect(blockingIssues({ ...report, revised: true })).toEqual([]);
  });

  it("treats a hierarchy risk and unsupported claims as notes, not blocks", () => {
    const report = { ...base, hierarchyRisk: "Takes sole credit for a team launch.", unsupportedClaims: ["40% growth"] };
    expect(blockingIssues(report)).toEqual([]);
    expect(checkNotes(report)).toHaveLength(2);
    expect(verdictLines(report)[0]).toMatchObject({ state: "check", label: "Safe to post · 2 things to check" });
  });

  it("handles drafts made before how-it-reads existed", () => {
    const lines = verdictLines({ ...base, howItReads: null });
    expect(lines[1].state).toBe("unknown");
    expect(lines[2].label).toBe("Add sample posts to check your voice");
  });
});
