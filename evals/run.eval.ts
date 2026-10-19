import { join } from "node:path";
import { expect, test, vi } from "vitest";
import { stubFor } from "./lib/stub";

// The quality bar: `npm run eval`. Options come from the environment:
//   EVAL_FUNCTIONS=draft,check   which functions (default: all)
//   EVAL_LIMIT=40                cases per function, sampled with a fixed seed (0 = all)
//   EVAL_SEED=1                  sampling seed; keep it fixed to compare runs
//   EVAL_CONCURRENCY=4           parallel cases
//   EVAL_JUDGE=0                 skip pairwise grading (plain-code metrics only)
//   EVAL_ESTIMATE=1              print the cost estimate and stop
//   EVAL_DRY_RUN=1               stand-in model answers; checks the harness, costs nothing
//   EVAL_LABEL=baseline-v1       a name for the run
// Needs OPENROUTER_API_KEY unless it's a dry run.

const env = process.env;
const dryRun = env.EVAL_DRY_RUN === "1";

if (dryRun) {
  vi.doMock("@/lib/ai/client", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/ai/client")>();
    const stub = async ({ schema }: { schema: Parameters<typeof stubFor>[0] }) => stubFor(schema);
    return { ...actual, runStructured: stub, runWithModel: stub };
  });
}

test("quality bar", async () => {
  const { FUNCTIONS, datasetFor, estimateCost, runAll } = await import("./lib/runner");
  const { loadRaw } = await import("./lib/load");
  const { markdown, writeRun } = await import("./lib/report");

  const functions = (env.EVAL_FUNCTIONS?.split(",").map((s) => s.trim()) ?? [...FUNCTIONS]) as (typeof FUNCTIONS)[number][];
  for (const fn of functions) expect(FUNCTIONS, `unknown function ${fn}`).toContain(fn);
  const opts = {
    functions,
    limit: Number(env.EVAL_LIMIT ?? 40),
    seed: Number(env.EVAL_SEED ?? 1),
    concurrency: Number(env.EVAL_CONCURRENCY ?? 4),
    judge: env.EVAL_JUDGE !== "0",
  };

  const sizes = Object.fromEntries(functions.map((fn) => [fn, loadRaw(datasetFor(fn))?.length ?? 0]));
  console.log(`Estimated cost: about $${estimateCost(opts, sizes).toFixed(0)} for ${functions.join(", ")} (${opts.limit || "all"} cases each).`);
  if (env.EVAL_ESTIMATE === "1") return;
  if (!dryRun && !env.OPENROUTER_API_KEY) throw new Error("Set OPENROUTER_API_KEY in the environment, or use EVAL_DRY_RUN=1 to check the harness.");

  const startedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
  const label = env.EVAL_LABEL ?? (dryRun ? "dry-run" : "run");
  const reports = await runAll(opts);
  const md = markdown(reports, { ...opts, label, dryRun, startedAt });
  const dir = join(__dirname, "out", `${startedAt.replace(/[: ]/g, "-")}-${label}`);
  writeRun(dir, reports, md, opts.seed);
  console.log(`\n${md}\n\nWritten to ${dir}`);
});
