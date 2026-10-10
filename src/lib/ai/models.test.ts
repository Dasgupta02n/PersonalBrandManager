import { describe, expect, it } from "vitest";
import { DEFAULT_MODEL, modelForTask, supportsServerFallback } from "./models";

describe("modelForTask", () => {
  it("defaults every task to the default model", () => {
    expect(modelForTask("draft_post", {})).toBe(DEFAULT_MODEL);
  });

  it("uses a per-task override when set", () => {
    expect(modelForTask("extract_wins", { AI_MODEL_EXTRACT_WINS: "claude-haiku-5-5" })).toBe("claude-haiku-5-5");
    expect(modelForTask("draft_post", { AI_MODEL_EXTRACT_WINS: "claude-haiku-5-5" })).toBe(DEFAULT_MODEL);
  });

  it("ignores blank overrides", () => {
    expect(modelForTask("post_ideas", { AI_MODEL_POST_IDEAS: "  " })).toBe(DEFAULT_MODEL);
  });
});

describe("supportsServerFallback", () => {
  it("is enabled for the default model and not for Haiku", () => {
    expect(supportsServerFallback(DEFAULT_MODEL)).toBe(true);
    expect(supportsServerFallback("claude-haiku-5-5")).toBe(false);
  });
});
