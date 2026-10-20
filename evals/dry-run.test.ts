import { describe, expect, it, vi } from "vitest";
import { stubFor } from "./lib/stub";

// Keeps the harness working: every function runs end to end on stand-in answers (no model, no
// cost) for each test set that exists.

// Set `refuse` to answer every call the way OpenRouter does when the account is out of credit.
const state = vi.hoisted(() => ({ refuse: false }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/client")>();
  const stub = async ({ schema }: { schema: Parameters<typeof stubFor>[0] }) => {
    if (state.refuse) throw new Error('402 {"type":"error","error":{"type":"billing_error","message":"This request would exceed your available credits"}}');
    return stubFor(schema);
  };
  return { ...actual, runStructured: stub, runWithModel: stub };
});

const { FUNCTIONS, datasetFor, loadReuse, runAll, stoppedForCredit } = await import("./lib/runner");
const { exists } = await import("./lib/load");
const { humanReviewKit, markdown } = await import("./lib/report");

const ready = exists("personas") ? FUNCTIONS.filter((fn) => exists(datasetFor(fn))) : [];

describe("the quality-bar harness (dry run)", () => {
  it.skipIf(!ready.length)("runs every function with a test set, end to end", async () => {
    const opts = { functions: ready, limit: 2, seed: 1, concurrency: 2, judge: true };
    const reports = await runAll(opts);
    for (const r of reports) {
      expect(r.errors, `${r.fn}: ${JSON.stringify(r.errors[0])}`).toEqual([]);
      expect(r.cases).toBe(2);
      expect(r.metrics.length).toBeGreaterThan(0);
    }
    const md = markdown(reports, { ...opts, label: "test", dryRun: true, startedAt: "now" });
    expect(md).toContain("Dry run");
    const kit = humanReviewKit(reports.flatMap((r) => r.pairs), 1);
    expect(Object.keys(kit.key).length).toBe(reports.flatMap((r) => r.pairs).length);
  });

  it.skipIf(!ready.length)("stops starting cases once the budget is reached", async () => {
    const [report] = await runAll({ functions: [ready[0]], limit: 3, seed: 1, concurrency: 1, judge: true, budget: 0 });
    expect(report.cases).toBe(0);
    expect(report.skippedForBudget).toBe(3);
  });

  it.skipIf(!ready.length)("reuses an earlier run's outputs for unchanged cases", async () => {
    const opts = { functions: ["draft" as const], limit: 2, seed: 1, concurrency: 1, judge: true };
    const first = await runAll(opts);
    const [again] = await runAll({ ...opts, reuse: loadReuse(first, ["draft"]) });
    expect(again.reused).toEqual({ product: 2, baseline: 2, judge: 2 });
    expect(again.cost.product + again.cost.baseline + again.cost.judge).toBe(0);
  });

  // Last: running out of credit stops the rest of the process's run.
  it.skipIf(!ready.length)("starts nothing new once OpenRouter refuses a call for lack of credit", async () => {
    state.refuse = true;
    const [report] = await runAll({ functions: [ready[0]], limit: 3, seed: 1, concurrency: 1, judge: true });
    expect(stoppedForCredit()).toBe(true);
    expect(report.cases).toBe(1);
    expect(report.skippedForBudget).toBe(2);
  });
});
