import { describe, expect, it } from "vitest";
import { DEFAULT_RULES } from "@/lib/domain/types";
import { privacyHints } from "./hints";
import { dictionarySpans } from "./names";
import { Vault, protect, restore, restoreDeep, termSpans, type Span } from "./pseudonymise";

const words = (text: string, spans: Span[]) => spans.map(([s, e]) => text.slice(s, e));

describe("protect", () => {
  it("gives each person one placeholder, including later mentions by first name", () => {
    const text = "Priya Raman fixed the bug; Priya thanked the team and Tyler Brooks agreed.";
    const at = text.indexOf("Tyler Brooks");
    const detected: Span[] = [[0, 11], [at, at + "Tyler Brooks".length]];
    const vault = new Vault();
    expect(protect(text, detected, {}, vault)).toBe("[Person 1] fixed the bug; [Person 1] thanked the team and [Person 2] agreed.");
  });

  it("masks known people and private terms even when the model finds nothing", () => {
    const text = "Shared the Project Falcon plan with ravi kapoor and Ravi's manager at Northbank.";
    const vault = new Vault();
    const out = protect(text, [], { knownPeople: ["Ravi Kapoor"], privateTerms: ["Project Falcon", "Northbank"] }, vault);
    expect(out).toBe("Shared the [Private 1] plan with [Person 1] and [Person 1]'s manager at [Private 2].");
  });

  it("prefers the longer span when two overlap", () => {
    const text = "Met Lim Mei Ling today.";
    const vault = new Vault();
    expect(protect(text, [[4, 7], [4, 16]], {}, vault)).toBe("Met [Person 1] today.");
  });

  it("leaves text without people alone", () => {
    expect(protect("Closed the Q3 audit early.", [], {}, new Vault())).toBe("Closed the Q3 audit early.");
  });
});

describe("restore", () => {
  const vault = new Vault();
  protect("Priya Raman ran the Falcon review.", [[0, 11]], { privateTerms: ["Falcon"] }, vault);

  it("puts names back, but never private terms", () => {
    expect(restore("Thanks to [Person 1] for the [Private 1] review.", vault)).toBe("Thanks to Priya Raman for the [private] review.");
  });

  it("writes 'a colleague' when names must stay out of the record", () => {
    expect(restore("[Person 1] ran the review.", vault, false)).toBe("a colleague ran the review.");
  });

  it("restores every string in a parsed answer", () => {
    expect(restoreDeep({ wins: [{ summary: "[person 1] led it", n: 3 }] }, vault)).toEqual({ wins: [{ summary: "Priya Raman led it", n: 3 }] });
  });
});

describe("name lists", () => {
  it("catch names the model may miss, in capitals or distinctive lowercase", () => {
    const text = "Siobhan and Bharat met; told suresh later.";
    expect(words(text, dictionarySpans(text))).toEqual(["Siobhan", "Bharat", "suresh"]);
  });

  it("leave names that are everyday words to the model", () => {
    const text = "Will present in Hong Kong in Jun; Grace period ends soon.";
    expect(dictionarySpans(text)).toEqual([]);
  });

  it("accept a colliding surname next to another name", () => {
    const text = "Marcus Lee and Tan Wei Ming agreed.";
    expect(words(text, dictionarySpans(text))).toEqual(["Marcus", "Lee", "Tan", "Wei", "Ming"]);
  });
});

describe("privacyHints", () => {
  it("keeps the user's name, contacts, never-mention terms and an unnameable employer away from the model", () => {
    const hints = privacyHints({
      fullName: "Asha Menon",
      knownPeople: ["Ravi Kapoor"],
      rules: { ...DEFAULT_RULES, employerName: "Northbank", employerPolicy: "generic", neverMention: ["Falcon"] },
    });
    expect(hints).toEqual({ knownPeople: ["Asha Menon", "Ravi Kapoor"], privateTerms: ["Falcon", "Northbank"], restorePeople: true });
  });

  it("lets the employer through when the user is happy to name it", () => {
    const hints = privacyHints({ rules: { ...DEFAULT_RULES, employerName: "Northbank", employerPolicy: "name" } });
    expect(hints.privateTerms).toEqual([]);
  });

  it("matches terms as whole words", () => {
    expect(termSpans("Falconry and Falcon.", "Falcon")).toEqual([[13, 19]]);
  });
});
