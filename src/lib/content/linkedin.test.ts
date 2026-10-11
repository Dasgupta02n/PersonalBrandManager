import { describe, expect, it } from "vitest";
import { postWithHashtags, seeMoreCutoff } from "./linkedin";

describe("seeMoreCutoff", () => {
  it("shows a short post in full", () => {
    expect(seeMoreCutoff("One line.")).toBe(9);
  });

  it("folds after the third line break", () => {
    const text = "Line one\nLine two\nLine three\nLine four";
    expect(text.slice(0, seeMoreCutoff(text))).toBe("Line one\nLine two\nLine three");
  });

  it("folds long first paragraphs at a word boundary near 210 characters", () => {
    const text = "word ".repeat(80);
    const cut = seeMoreCutoff(text);
    expect(cut).toBeLessThanOrEqual(210);
    expect(cut).toBeGreaterThan(180);
    expect(text[cut]).toBe(" ");
  });
});

describe("postWithHashtags", () => {
  it("adds hashtags on their own line", () => {
    expect(postWithHashtags("Body ", ["#a", "#b"])).toBe("Body\n\n#a #b");
    expect(postWithHashtags("Body", [])).toBe("Body");
  });
});
