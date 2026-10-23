import { describe, expect, it } from "vitest";
import { chunk, findPeople, mostlyLowercase, titleCaseLowercase, wordPieceSpans } from "./ner.mjs";

const tok = (word, entity, score = 0.99) => ({ word, entity, score });

describe("wordPieceSpans", () => {
  it("joins word pieces into whole names and merges first and last names", () => {
    const text = "Ananya and Rohit Malhotra met.";
    const tokens = [
      tok("Ana", "B-PER"), tok("##nya", "B-PER"), tok("and", "O"),
      tok("R", "B-PER"), tok("##oh", "B-PER"), tok("##it", "B-PER"), tok("Mal", "I-PER"), tok("##hot", "I-PER"), tok("##ra", "I-PER", 0.4),
      tok("met", "O"), tok(".", "O"),
    ];
    const spans = wordPieceSpans(text, tokens).map(([s, e]) => text.slice(s, e));
    expect(spans).toEqual(["Ananya", "Rohit Malhotra"]);
  });

  it("drops a possessive and keeps apostrophes inside names", () => {
    const text = "Niamh O'Connor's team.";
    const tokens = [tok("N", "B-PER"), tok("##iam", "B-PER"), tok("##h", "B-PER"), tok("O", "I-PER"), tok("'", "I-PER"), tok("Connor", "I-PER"), tok("'", "O"), tok("s", "O")];
    expect(wordPieceSpans(text, tokens).map(([s, e]) => text.slice(s, e))).toEqual(["Niamh O'Connor"]);
  });

  it("ignores low-confidence tags", () => {
    expect(wordPieceSpans("Grace period", [tok("Grace", "B-PER", 0.3), tok("period", "O")])).toEqual([]);
  });
});

describe("lowercase notes", () => {
  it("spots a note typed all in lowercase, not one with a few lowercase words", () => {
    expect(mostlyLowercase("told ravi the deck is ready")).toBe(true);
    expect(mostlyLowercase("Soon after launch, churn fell by a third at Acme.")).toBe(false);
    expect(titleCaseLowercase("told ravi")).toBe("Told Ravi");
  });

  it("runs a second pass on lowercase notes and keeps only names that were lowercase", async () => {
    const tag = async (t) =>
      t.startsWith("Told") ? [tok("Told", "O"), tok("Ravi", "B-PER"), tok("The", "O")] : [tok("told", "O"), tok("ravi", "O"), tok("the", "O")];
    const text = "told ravi the deck is ready";
    const spans = await findPeople(text, tag);
    expect(spans.map(([s, e]) => text.slice(s, e))).toEqual(["ravi"]);
  });
});

describe("chunk", () => {
  it("splits long notes at sentence ends and keeps offsets", () => {
    const text = "First sentence here. ".repeat(100);
    const pieces = chunk(text, 200);
    expect(pieces.length).toBeGreaterThan(5);
    expect(pieces.map((p) => p.text).join("")).toBe(text);
    for (const p of pieces) expect(text.slice(p.offset, p.offset + p.text.length)).toBe(p.text);
  });
});
