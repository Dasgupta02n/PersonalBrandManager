import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, type ConfidentialityRules } from "@/lib/domain/types";
import { checkText, countWords, findBusinessFigures, findTerm } from "./check";

const rules = (overrides: Partial<ConfidentialityRules> = {}): ConfidentialityRules => ({
  ...DEFAULT_RULES,
  ...overrides,
});

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

describe("findTerm", () => {
  it("matches whole terms case-insensitively", () => {
    expect(findTerm("We partnered with ACME Corp last quarter", "acme corp")).toBe("ACME Corp");
  });

  it("does not match inside longer words", () => {
    expect(findTerm("The Acmeville team", "Acme")).toBeNull();
  });

  it("treats curly and straight apostrophes the same", () => {
    expect(findTerm("In today’s fast-paced world", "in today's fast-paced world")).not.toBeNull();
  });
});

describe("countWords", () => {
  it("ignores hashtags", () => {
    expect(countWords("Three real words #sales #leadership")).toBe(3);
  });
});

describe("findBusinessFigures", () => {
  it("finds money, percentages and large counts but not years or small counts", () => {
    const found = findBusinessFigures("In 2024 we grew 52% to ₹27 Cr across 3 regions and 1,250 outlets").map(
      (f) => f.text,
    );
    expect(found).toEqual(["52%", "₹27 Cr", "1,250"]);
  });

  it("ignores digits inside words like B2B or Q3", () => {
    expect(findBusinessFigures("Our B2B pipeline in Q3")).toEqual([]);
  });

  it("marks decimals and many significant digits as precise", () => {
    const [a, b, c] = findBusinessFigures("₹27.4 Cr, 1,234,567 units and 40%");
    expect(a.precise).toBe(true);
    expect(b.precise).toBe(true);
    expect(c.precise).toBe(false);
  });
});

describe("checkText", () => {
  it("passes a clean post of the right length", () => {
    const result = checkText(words(150), { kind: "post", rules: rules() });
    expect(result.passed).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("blocks never-mention terms", () => {
    const result = checkText(`${words(150)} Project Falcon`, {
      kind: "post",
      rules: rules({ neverMention: ["Project Falcon"] }),
    });
    expect(result.passed).toBe(false);
    expect(result.issues[0]).toMatchObject({ code: "never_mention", severity: "error" });
  });

  it("enforces the employer-name policy", () => {
    const text = `${words(150)} at Globex`;
    expect(checkText(text, { kind: "post", rules: rules({ employerName: "Globex", employerPolicy: "name" }) }).passed).toBe(
      true,
    );
    const generic = checkText(text, { kind: "post", rules: rules({ employerName: "Globex", employerPolicy: "generic" }) });
    expect(generic.passed).toBe(false);
    expect(generic.issues[0].code).toBe("employer_name");
  });

  it("blocks job-search signals and clichés", () => {
    const result = checkText(`Thrilled to announce my next chapter. ${words(150)}`, { kind: "post", rules: rules() });
    const codes = result.issues.map((i) => i.code);
    expect(codes).toContain("job_search");
    expect(codes).toContain("cliche");
    expect(result.passed).toBe(false);
  });

  it("applies the number policy", () => {
    const text = `${words(150)} We grew revenue to ₹27.4 Cr and margin by 12%.`;
    const rounded = checkText(text, { kind: "post", rules: rules({ numberPolicy: "rounded" }) });
    expect(rounded.issues.filter((i) => i.code === "number_precision").map((i) => i.match)).toEqual(["₹27.4 Cr"]);

    const relative = checkText(text, { kind: "post", rules: rules({ numberPolicy: "relative" }) });
    expect(relative.issues.filter((i) => i.code === "number_precision")).toHaveLength(2);

    const exact = checkText(text, { kind: "post", rules: rules({ numberPolicy: "exact" }) });
    expect(exact.passed).toBe(true);
  });

  it("warns about length without failing", () => {
    const short = checkText(words(40), { kind: "post", rules: rules() });
    expect(short.passed).toBe(true);
    expect(short.issues[0]).toMatchObject({ code: "length", severity: "warning" });

    const longComment = checkText(words(120), { kind: "comment", rules: rules() });
    expect(longComment.issues[0]).toMatchObject({ code: "length", severity: "warning" });
  });
});
