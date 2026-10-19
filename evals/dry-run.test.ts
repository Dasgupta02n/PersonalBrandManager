import { describe, expect, it, vi } from "vitest";
import { stubFor } from "./lib/stub";

// Keeps the harness working: every function runs end to end on stand-in answers (no model, no
// cost) for each test set that exists.

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/client")>();
  const stub = async ({ schema }: { schema: Parameters<typeof stubFor>[0] }) => stubFor(schema);
  return { ...actual, runStructured: stub, runWithModel: stub };
});

const { FUNCTIONS, datasetFor, runAll } = await import("./lib/runner");
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
});
