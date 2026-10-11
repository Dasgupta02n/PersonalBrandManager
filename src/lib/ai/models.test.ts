import { describe, expect, it } from "vitest";
import { AI_TASKS, OPUS, PROVIDER_PREFERENCES, TASK_SETTINGS, effortForTask, modelForTask } from "./models";

describe("TASK_SETTINGS", () => {
  it("pins every function, live or planned, to a Claude model on OpenRouter", () => {
    expect(AI_TASKS.length).toBe(14);
    for (const task of AI_TASKS) {
      expect(modelForTask(task, {})).toMatch(/^anthropic\/claude-[a-z]+-\d+(\.\d+)?$/);
    }
  });

  it("marks the five functions that have code as live", () => {
    const live = AI_TASKS.filter((task) => TASK_SETTINGS[task].live);
    expect(live).toEqual(["extract_wins", "post_ideas", "draft_post", "check_draft", "draft_comments"]);
  });

  it("keeps drafting and the guardrail check at high effort", () => {
    expect(effortForTask("draft_post")).toBe("high");
    expect(effortForTask("check_draft")).toBe("high");
  });

  it("only allows zero-data-retention hosts that support every request parameter", () => {
    expect(PROVIDER_PREFERENCES).toEqual({ zdr: true, require_parameters: true });
  });
});

describe("modelForTask", () => {
  it("uses the pinned model by default", () => {
    expect(modelForTask("draft_post", {})).toBe(OPUS);
  });

  it("uses a per-task override when set", () => {
    const env = { AI_MODEL_EXTRACT_WINS: "anthropic/claude-haiku-5.5" };
    expect(modelForTask("extract_wins", env)).toBe("anthropic/claude-haiku-5.5");
    expect(modelForTask("draft_post", env)).toBe(OPUS);
  });

  it("ignores blank overrides", () => {
    expect(modelForTask("post_ideas", { AI_MODEL_POST_IDEAS: "  " })).toBe(OPUS);
  });
});
