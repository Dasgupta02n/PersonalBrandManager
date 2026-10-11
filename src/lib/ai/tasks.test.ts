import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_RULES, type UserContext } from "@/lib/domain/types";

vi.mock("server-only", () => ({}));

const outputs: Record<string, unknown> = {};
vi.mock("./client", () => ({
  runStructured: vi.fn(async ({ task }: { task: string }) => outputs[task]),
}));

const { readAsAudience, recheckPost, reviewDraft } = await import("./tasks");

const ctx: UserContext = {
  fullName: "Priya",
  headline: "VP Sales",
  targetIndustries: [],
  targetRoles: [],
  tone: "balanced",
  pillars: [],
  voice: { summary: "", samplePosts: [] },
  rules: { ...DEFAULT_RULES, noGoTopics: ["politics"] },
};

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
const body = `We opened three new states this quarter. ${words(140)}`;

const cleanCheck = {
  grounded: true,
  unsupported_claims: [],
  confidentiality_ok: true,
  confidentiality_problems: [],
  job_search_signal: false,
  no_go_topic_hits: [],
  hierarchy_risk: null,
  revised_body: null,
};

const howItReads = {
  verdict: "confident",
  sounds_like_user: true,
  readers: [{ reader: "peer", reads_as: "Credible and useful", concern: null }],
  lines: [
    { quote: "We opened three new states", issue: "unclear", suggestion: "We expanded into three states" },
    { quote: "not in the post", issue: "boastful", suggestion: "x" },
  ],
};

describe("review pipeline", () => {
  beforeEach(() => {
    for (const key of Object.keys(outputs)) delete outputs[key];
  });

  it("fails a draft that touches a no-go topic and applies the fix", async () => {
    outputs.check_draft = { ...cleanCheck, no_go_topic_hits: ["politics"], revised_body: body };
    const result = await reviewDraft({ body, kind: "post", facts: [], ctx });
    expect(result.report.noGoTopics).toEqual(["politics"]);
    expect(result.report.revised).toBe(true);
  });

  it("never overwrites the user's own edits when re-checking; the fix comes back as a suggestion", async () => {
    outputs.check_draft = { ...cleanCheck, confidentiality_ok: false, revised_body: "Safer version" };
    outputs.how_it_reads = howItReads;
    const result = await recheckPost({ body, facts: [], ctx });
    expect(result.suggestedBody).toBe("Safer version");
    expect(result.report.revised).toBe(false);
    expect(result.report.passed).toBe(false);
  });

  it("notes a hierarchy risk without failing an otherwise safe draft", async () => {
    outputs.check_draft = { ...cleanCheck, hierarchy_risk: "Takes sole credit for a team launch." };
    const result = await reviewDraft({ body, kind: "post", facts: [], ctx, applyFix: false });
    expect(result.report.hierarchyRisk).toBe("Takes sole credit for a team launch.");
    expect(result.report.passed).toBe(true);
  });

  it("keeps only quoted lines that appear in the post, and hides voice match without samples", async () => {
    outputs.how_it_reads = howItReads;
    const result = await readAsAudience({ body, ctx });
    expect(result.lines.map((l) => l.quote)).toEqual(["We opened three new states"]);
    expect(result.soundsLikeYou).toBeNull();
  });
});
