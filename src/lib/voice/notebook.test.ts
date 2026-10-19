import { describe, expect, it } from "vitest";
import { EMPTY_STATS, avoidedWords, buildNotebook, learnFromEdit, learnFromRevision, learnFromSkippedIdea } from "./notebook";

const ai = "I am thrilled! I led the team to leverage our pricing data 🚀 and we grew margins. #sales #growth #leadership";
const posted = "We used our pricing data and grew margins. Credit to the regional team.";

describe("learnFromEdit", () => {
  it("learns what the user removed and how they changed the tone", () => {
    const stats = learnFromEdit(EMPTY_STATS, ai, posted);
    expect(stats.pairs).toBe(1);
    expect(stats.removed.leverage).toBe(1);
    expect(stats.removed.thrilled).toBe(1);
    expect(stats.added.credit).toBe(1);
    expect(stats).toMatchObject({ towardsWe: 1, emojiRemoved: 1, hashtagsRemoved: 1, exclamationsRemoved: 1, shortened: 1 });
  });

  it("ignores drafts posted unchanged", () => {
    expect(learnFromEdit(EMPTY_STATS, ai, ai)).toBe(EMPTY_STATS);
  });

  it("never learns common words", () => {
    const stats = learnFromEdit(EMPTY_STATS, "This is about the work we did with them", "Shipped it");
    expect(Object.keys(stats.removed)).not.toContain("about");
    expect(Object.keys(stats.removed)).not.toContain("with");
  });
});

describe("the notebook", () => {
  const twice = learnFromEdit(learnFromEdit(EMPTY_STATS, ai, posted), ai, posted);

  it("turns patterns seen in two drafts into notes and words to avoid", () => {
    const book = buildNotebook({ edit_stats: twice });
    expect(book.notes.map((n) => n.text)).toEqual(
      expect.arrayContaining(["Says “we” rather than “I” for team results", "No emojis", "Few or no hashtags", "No exclamation marks"]),
    );
    expect(book.avoidWords).toEqual(expect.arrayContaining(["leverage", "thrilled"]));
  });

  it("doesn't call a word avoided after the user adds it back", () => {
    const back = learnFromEdit(twice, "We shipped it.", "We shipped it and will leverage it next quarter.");
    expect(avoidedWords(back)).not.toContain("leverage");
  });

  it("keeps the user's own notes and what the AI learned, minus anything they removed", () => {
    const book = buildNotebook({
      summary: "Plain and warm.",
      notes: [
        { key: "you:1", text: "Never mention my old employer", source: "you" },
        { key: "ai:1", text: "Opens with a plain fact", source: "learned" },
      ],
      muted: ["ai:1", "edits:emoji", "avoid:thrilled"],
      edit_stats: twice,
    });
    const texts = book.notes.map((n) => n.text);
    expect(texts).toContain("Never mention my old employer");
    expect(texts).not.toContain("Opens with a plain fact");
    expect(texts).not.toContain("No emojis");
    expect(book.avoidWords).not.toContain("thrilled");
  });

  it("learns from dismissed ideas and revisions", () => {
    let stats = EMPTY_STATS;
    for (let i = 0; i < 3; i++) stats = learnFromSkippedIdea(stats, "how_to");
    stats = learnFromRevision(learnFromRevision(stats, "humbler"), "humbler");
    const book = buildNotebook({ edit_stats: stats });
    expect(book.skippedFormats).toEqual(["how_to"]);
    expect(book.notes.map((n) => n.text)).toEqual(expect.arrayContaining(["Rarely picks how-to posts", "Prefers a more modest tone"]));
  });

  it("reads an empty or missing row safely", () => {
    expect(buildNotebook(null)).toEqual({ summary: "", notes: [], avoidWords: [], skippedFormats: [] });
  });
});
