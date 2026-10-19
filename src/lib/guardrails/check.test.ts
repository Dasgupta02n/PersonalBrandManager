import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, type ConfidentialityRules } from "@/lib/domain/types";
import { checkText, countWords, findBusinessFigures, findTerm, issueTier, maskTerms } from "./check";

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

  it("blocks job-search signals but only suggests fixes for clichés", () => {
    const result = checkText(`Thrilled to announce my next chapter. ${words(150)}`, { kind: "post", rules: rules() });
    expect(result.issues.find((i) => i.code === "job_search")?.severity).toBe("error");
    expect(result.issues.find((i) => i.code === "cliche")?.severity).toBe("warning");
    expect(result.passed).toBe(false);

    const clicheOnly = checkText(`Thrilled to announce the launch. ${words(150)}`, { kind: "post", rules: rules() });
    expect(clicheOnly.passed).toBe(true);
  });

  it("flags humblebrags and AI-sounding patterns as suggestions", () => {
    const text = `Humbled to announce our results. It’s not about the tools, it’s about the people.\n${words(150)}\nThoughts?`;
    const issues = checkText(text, { kind: "post", rules: rules() }).issues;
    expect(issues.map((i) => i.code)).toEqual(expect.arrayContaining(["humblebrag", "ai_tell"]));
    expect(issues.filter((i) => i.code === "ai_tell")).toHaveLength(2);
    expect(issues.every((i) => i.severity === "warning")).toBe(true);
  });

  it("flags hashtag stacks", () => {
    const issues = checkText(`${words(150)} #a #b #c #d`, { kind: "post", rules: rules() }).issues;
    expect(issues.some((i) => i.message.startsWith("4 hashtags"))).toBe(true);
  });

  it("does not flag a genuine closing question", () => {
    const issues = checkText(`${words(150)}\nWhat would you have done differently?`, { kind: "post", rules: rules() }).issues;
    expect(issues).toEqual([]);
  });

  it("assigns tiers: confidentiality blocks, job-search notes, style suggests", () => {
    expect(issueTier("never_mention")).toBe(1);
    expect(issueTier("number_precision")).toBe(1);
    expect(issueTier("job_search")).toBe(2);
    expect(issueTier("humblebrag")).toBe(3);
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

describe("regulated-firm mode", () => {
  const text = `${words(150)} Our fund offers guaranteed returns and delivered 14% annual returns last year.`;

  it("stops promissory and performance language when the user works at a regulated firm", () => {
    const result = checkText(text, { kind: "post", rules: rules({ regulated: true, numberPolicy: "exact" }) });
    expect(result.passed).toBe(false);
    expect(result.issues.filter((i) => i.code === "regulated_language").map((i) => i.match)).toEqual([
      "guaranteed returns",
      "14% annual returns",
    ]);
    expect(issueTier("regulated_language")).toBe(1);
  });

  it("leaves other users alone", () => {
    const result = checkText(text, { kind: "post", rules: rules({ numberPolicy: "exact" }) });
    expect(result.issues.some((i) => i.code === "regulated_language")).toBe(false);
  });
});

describe("sensitive information", () => {
  it("notes words that suggest something isn't public yet, without blocking", () => {
    const result = checkText(`${words(150)} The launch is still under NDA.`, { kind: "post", rules: rules() });
    expect(result.passed).toBe(true);
    expect(result.issues.find((i) => i.code === "sensitive")?.match).toBe("under NDA");
    expect(issueTier("sensitive")).toBe(2);
  });

  it("flags a named client only when asked to (the free checker)", () => {
    const text = `${words(150)} We rebuilt onboarding for our client Northwind Health in six weeks.`;
    expect(checkText(text, { kind: "post", rules: rules() }).issues.some((i) => i.code === "names_client")).toBe(false);
    const flagged = checkText(text, { kind: "post", rules: rules(), flagClientNames: true });
    expect(flagged.issues.find((i) => i.code === "names_client")?.match).toBe("Northwind Health");
  });

  it("does not mistake pronouns for client names", () => {
    const text = `${words(150)} The client I worked with last year taught me this.`;
    const result = checkText(text, { kind: "post", rules: rules(), flagClientNames: true });
    expect(result.issues.some((i) => i.code === "names_client")).toBe(false);
  });
});

describe("maskTerms", () => {
  it("replaces never-mention terms with a placeholder, longest first", () => {
    expect(maskTerms("Closed Acme Bank and Acme today", ["Acme", "Acme Bank"])).toBe("Closed [private] and [private] today");
  });

  it("leaves text untouched when nothing matches", () => {
    expect(maskTerms("Shipped the pricing change’s first phase", ["Acme"])).toBe("Shipped the pricing change’s first phase");
  });
});
