import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_RULES, type UserContext } from "@/lib/domain/types";

vi.mock("server-only", () => ({}));

// Each task's canned output, or a function of the call for tasks called more than once.
const outputs: Record<string, unknown> = {};
vi.mock("./client", () => ({
  runStructured: vi.fn(async (args: { task: string; prompt: string }) => {
    const out = outputs[args.task];
    return typeof out === "function" ? out(args) : out;
  }),
}));

const { draftPost, extractWins, generatePostIdeas, learnVoice, readAsAudience, recheckPost, revisePost, reviewDraft, suggestProfile } = await import("./tasks");

const ctx: UserContext = {
  fullName: "Priya",
  headline: "VP Sales",
  targetIndustries: [],
  targetRoles: [],
  tone: "balanced",
  pillars: [],
  voice: { summary: "", samplePosts: [], notes: [], avoidWords: [], skippedFormats: [] },
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

  it("never rewrites a draft for a hierarchy risk alone", async () => {
    outputs.check_draft = { ...cleanCheck, hierarchy_risk: "Takes sole credit for a team launch.", revised_body: "Rewritten" };
    const result = await reviewDraft({ body, kind: "post", facts: [], ctx });
    expect(result.body).toBe(body);
    expect(result.report.revised).toBe(false);
  });

  it("keeps a revision as made and offers any safety fix as a suggestion", async () => {
    outputs.revise_draft = { body: `${body} Shorter.` };
    outputs.check_draft = { ...cleanCheck, confidentiality_ok: false, revised_body: "Safer version" };
    outputs.how_it_reads = howItReads;
    const result = await revisePost({ body, mode: "shorter", facts: [], ctx });
    expect(result.body).toBe(`${body} Shorter.`);
    expect(result.suggestedBody).toBe("Safer version");
  });

  it("keeps only quoted lines that appear in the post, and hides voice match without samples", async () => {
    outputs.how_it_reads = howItReads;
    const result = await readAsAudience({ body, ctx });
    expect(result.lines.map((l) => l.quote)).toEqual(["We opened three new states"]);
    expect(result.soundsLikeYou).toBeNull();
  });
});

describe("keeping names out of the record", () => {
  const extracted = { wins: [], follow_up_question: null, masked_note: "Closed the renewal with a client's CFO." };

  it("returns the AI's masked note when the user keeps names out", async () => {
    outputs.extract_wins = extracted;
    const result = await extractWins({ text: "Closed the renewal with Ravi at Acme.", ctx: { ...ctx, rules: { ...ctx.rules, maskNames: true } } });
    expect(result.maskedNote).toBe("Closed the renewal with a client's CFO.");
  });

  it("ignores it when the user has turned masking off", async () => {
    outputs.extract_wins = extracted;
    const result = await extractWins({ text: "Closed the renewal with Ravi at Acme.", ctx: { ...ctx, rules: { ...ctx.rules, maskNames: false } } });
    expect(result.maskedNote).toBeNull();
  });
});

describe("quality steps", () => {
  beforeEach(() => {
    for (const key of Object.keys(outputs)) delete outputs[key];
  });

  const extracted = {
    wins: [{ summary: "Priya closed the renewal", impact: "Shows she wanted to protect the account", metric: null, skills: [], pillar: null, confidential: false, kind: "result" }],
    follow_up_question: null,
    masked_note: null,
  };

  it("fact-checks wins when switched on, and keeps the originals if the checker drops one", async () => {
    outputs.extract_wins = extracted;
    outputs.verify_wins = { wins: [{ summary: "Priya closed the renewal", impact: "Keeps the account" }] };
    const checked = await extractWins({ text: "Closed the renewal.", ctx, quality: { verifyWins: true } });
    expect(checked.wins[0].impact).toBe("Keeps the account");

    outputs.verify_wins = { wins: [] };
    const kept = await extractWins({ text: "Closed the renewal.", ctx, quality: { verifyWins: true } });
    expect(kept.wins[0].impact).toBe("Shows she wanted to protect the account");
  });

  it("fact-checks idea angles and first lines when switched on", async () => {
    const win = { id: "w1", occurredOn: "2026-10-01", summary: "Opened three states", impact: "", metric: null, kind: "result", confidential: false, pillarId: null } as never;
    outputs.post_ideas = { ideas: [{ format: "lesson", angle: "Expansion led to record revenue", hook: "Three states, record revenue.", pillar: null, source_win_ids: ["w1"] }] };
    outputs.verify_ideas = { ideas: [{ angle: "What opening three states taught us", hook: "We opened three states this quarter." }] };
    const [idea] = await generatePostIdeas({ wins: [win], ctx, quality: { verifyIdeas: true } });
    expect(idea).toMatchObject({ angle: "What opening three states taught us", hook: "We opened three states this quarter.", sourceWinIds: ["w1"] });
  });

  it("writes several drafts and keeps the one the editor chooses", async () => {
    outputs.draft_post = ({ prompt }: { prompt: string }) => ({
      hook: "We opened three new states this quarter.",
      body: prompt.includes("point a peer can use") ? `${body} The useful version.` : body,
      hashtags: [],
    });
    outputs.select_draft = { best: 2, reason: "Gives peers the most to use." };
    outputs.check_draft = cleanCheck;
    outputs.how_it_reads = howItReads;
    const idea = { format: "lesson" as const, angle: "Expansion", hook: "We opened three new states this quarter.", sourceWinIds: [] };
    const result = await draftPost({ idea, wins: [], ctx, quality: { draftCandidates: 3 } });
    expect(result.body).toContain("The useful version.");

    outputs.select_draft = { best: 7, reason: "Out of range" };
    const fallback = await draftPost({ idea, wins: [], ctx, quality: { draftCandidates: 3 } });
    expect(fallback.body).not.toContain("The useful version.");
  });
});

describe("profile and CV suggestions", () => {
  it("checks every section like a post and flags job-hunting signals", async () => {
    outputs.profile_suggestions = {
      headline: { text: "Head of Sales | Open to new opportunities", reason: "From your wins." },
      about: { text: "I build sales teams.", reason: "r" },
      experience: { bullets: ["Grew the channel team", ""], reason: "r" },
      cv: { bullets: ["Cut discounting"], reason: "r" },
      skills: { items: ["Pricing", "Hiring"], reason: "r" },
    };
    const result = await suggestProfile({ wins: [], current: { headline: "", about: "", experience: "" }, ctx });
    expect(result.map((s) => s.section)).toEqual(["headline", "about", "experience", "cv", "skills"]);
    expect(result[0].issues.some((i) => i.code === "job_search")).toBe(true);
    expect(result[2].text).toBe("• Grew the channel team");
    expect(result.every((s) => s.issues.every((i) => i.code !== "length"))).toBe(true);
  });
});

describe("learning how the user writes", () => {
  it("keeps style notes and drops any that mention a private name or the employer", async () => {
    outputs.voice_profile = {
      summary: "Plain and modest.",
      notes: ["Opens with a plain fact", "Mentions Acme Bank often", "Credits Northwind for every result", "British spelling"],
    };
    const result = await learnVoice({
      samples: ["A sample"],
      pairs: [],
      removed: [],
      rules: { ...ctx.rules, neverMention: ["Acme Bank"], employerName: "Northwind", employerPolicy: "generic" },
    });
    expect(result.notes).toEqual(["Opens with a plain fact", "British spelling"]);
  });

  it("flags words the user keeps removing as a quiet suggestion", async () => {
    outputs.check_draft = cleanCheck;
    const result = await reviewDraft({
      body: `We decided to leverage the regional data. ${words(140)}`,
      kind: "post",
      facts: [],
      ctx: { ...ctx, voice: { ...ctx.voice, avoidWords: ["leverage"] } },
    });
    expect(result.report.issues.find((i) => i.code === "style_avoid")?.match).toBe("leverage");
    expect(result.report.passed).toBe(true);
  });
});
