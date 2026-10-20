import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, vi } from "vitest";
import { stubFor } from "./lib/stub";

// The quality bar: `npm run eval`. Options come from the environment:
//   EVAL_FUNCTIONS=draft,check   which functions (default: all)
//   EVAL_LIMIT=40                cases per function, sampled with a fixed seed (0 = all)
//   EVAL_LIMITS=draft=25,check=60  per-function overrides of EVAL_LIMIT
//   EVAL_BUDGET=20               hard cap in US dollars; spends on the most important functions first
//   EVAL_SEED=1                  sampling seed; keep it fixed to compare runs
//   EVAL_CONCURRENCY=4           parallel cases
//   EVAL_JUDGE=0                 skip pairwise grading (plain-code metrics only)
//   EVAL_ESTIMATE=1              print the cost estimate and stop
//   EVAL_DRY_RUN=1               stand-in model answers; checks the harness, costs nothing
//   EVAL_LABEL=baseline-v1       a name for the run
//   EVAL_REUSE=evals/out/<run>   reuse that run's outputs for unchanged cases (baseline only while
//                                the baseline prompts are unchanged); grading always runs again
//   EVAL_REUSE_PRODUCT=check     also reuse product outputs for functions whose pipeline is unchanged
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
  const { FUNCTIONS, datasetFor, estimateCost, loadReuse, runAll } = await import("./lib/runner");
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
    limits: Object.fromEntries(
      (env.EVAL_LIMITS ?? "")
        .split(",")
        .map((pair) => pair.split("=").map((s) => s.trim()))
        .filter(([fn, n]) => fn && n)
        .map(([fn, n]) => [fn, Number(n)]),
    ),
    budget: env.EVAL_BUDGET ? Number(env.EVAL_BUDGET) : undefined,
    reuse: env.EVAL_REUSE
      ? loadReuse(
          JSON.parse(readFileSync(join(env.EVAL_REUSE, "results.json"), "utf8")),
          (env.EVAL_REUSE_PRODUCT?.split(",").map((s) => s.trim()).filter(Boolean) ?? []) as (typeof FUNCTIONS)[number][],
        )
      : undefined,
  };
  for (const fn of opts.reuse?.product ?? []) expect(FUNCTIONS, `unknown function in EVAL_REUSE_PRODUCT: ${fn}`).toContain(fn);
  for (const fn of Object.keys(opts.limits)) expect(FUNCTIONS, `unknown function in EVAL_LIMITS: ${fn}`).toContain(fn);

  const sizes = Object.fromEntries(functions.map((fn) => [fn, loadRaw(datasetFor(fn))?.length ?? 0]));
  const estimate = estimateCost(opts, sizes);
  console.log(`Estimated cost: about $${estimate.toFixed(0)} for ${functions.join(", ")}${opts.budget !== undefined ? `, capped at $${opts.budget}` : ""}.`);
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
