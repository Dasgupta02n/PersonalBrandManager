import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ci } from "./stats";
import type { FunctionReport, PairRecord, RunOptions } from "./runner";

const money = (usd: number) => `$${usd.toFixed(2)}`;
const total = (r: FunctionReport) => r.cost.product + r.cost.baseline + r.cost.judge;

export function markdown(reports: FunctionReport[], opts: RunOptions & { label: string; dryRun: boolean; startedAt: string }): string {
  const lines = [
    `# Quality bar: ${opts.label}`,
    "",
    opts.dryRun ? "> **Dry run.** Stand-in model answers; these numbers check the harness and mean nothing about quality.\n" : "",
    `Run ${opts.startedAt} · seed ${opts.seed} · Claude Opus 5.5 via OpenRouter for the product, the baseline and the grader · total cost ${money(reports.reduce((s, r) => s + total(r), 0))}${opts.budget !== undefined ? ` (cap $${opts.budget})` : ""}`,
    "",
    "Product = the full pipeline (prompts, checks, style notebook). Baseline = the strongest single prompt on the same model with the same facts. Win rates are from blind comparisons in both orders; a win needs both orders to agree.",
    "",
    "## Summary",
    "",
    "| Function | Cases | Win rate vs baseline | Gate | Errors | Cost |",
    "|---|---|---|---|---|---|",
    ...reports.map(
      (r) =>
        `| ${r.fn} | ${r.cases}${r.skippedForBudget ? ` (+${r.skippedForBudget} skipped: budget)` : ""} | ${r.rate ? ci(r.rate) : "–"} | ${r.gate ? (r.gate.passed ? "Pass" : "**Fail**") : "–"} | ${r.errors.length} | ${money(total(r))} |`,
    ),
    "",
  ];
  for (const r of reports) {
    lines.push(`## ${r.fn}`, "");
    if (r.gate) lines.push(`**Gate:** ${r.gate.rule}: ${r.gate.passed ? "pass" : "**fail**"}`, "");
    if (r.rate) {
      lines.push(`**Win rate:** ${ci(r.rate)} (${r.rate.wins} wins, ${r.rate.ties} ties, ${r.rate.losses} losses)`, "");
      lines.push("| Criterion | Win rate |", "|---|---|", ...Object.entries(r.criteria).map(([k, v]) => `| ${k} | ${ci(v)} |`), "");
    }
    if (r.metrics.length) lines.push("| Measure | Product | Baseline |", "|---|---|---|", ...r.metrics.map((x) => `| ${x.label} | ${x.product} | ${x.baseline} |`), "");
    const kept = r.reused && r.reused.product + r.reused.baseline ? ` Reused from an earlier run: ${r.reused.product} product and ${r.reused.baseline} baseline outputs.` : "";
    lines.push(`Cost: product ${money(r.cost.product)}, baseline ${money(r.cost.baseline)}, grading ${money(r.cost.judge)}.${kept}`, "");
    if (r.errors.length) lines.push(`Errors (${r.errors.length}): ${r.errors.slice(0, 3).map((e) => `${e.side} ${e.caseId}: ${e.message}`).join("; ")}`, "");
  }
  return lines.filter((l, i, all) => !(l === "" && all[i - 1] === "")).join("\n");
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A self-contained page for expert reviewers: each pair shown blind as Output 1 and Output 2 in
 * random order, rated in the browser and downloaded as CSV. The key is a separate file.
 */
export function humanReviewKit(pairs: PairRecord[], seed: number): { html: string; key: Record<string, "1" | "2"> } {
  let s = seed;
  const flip = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648) < 0.5;
  const key: Record<string, "1" | "2"> = {};
  const items = pairs.map((p, i) => {
    const productFirst = flip();
    const id = `${p.fn}:${p.caseId}`;
    key[id] = productFirst ? "1" : "2";
    const [one, two] = productFirst ? [p.product, p.baseline] : [p.baseline, p.product];
    return `<section data-id="${esc(id)}">
<h2>${i + 1}. ${esc(p.fn)} · ${esc(p.caseId)}</h2>
<details><summary>Context</summary><pre>${esc(p.context)}</pre></details>
<div class="pair"><div><h3>Output 1</h3><pre>${esc(one)}</pre></div><div><h3>Output 2</h3><pre>${esc(two)}</pre></div></div>
<fieldset><legend>Which would this person rather post or use?</legend>
<label><input type="radio" name="r${i}" value="1"> Output 1</label>
<label><input type="radio" name="r${i}" value="2"> Output 2</label>
<label><input type="radio" name="r${i}" value="tie"> No real difference</label>
<input type="text" name="c${i}" placeholder="Why (optional)"></fieldset>
</section>`;
  });
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Blind review</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:16px;background:#faf8f3;color:#17161a}
section{border-top:1px solid #ddd;padding:16px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:700px){.pair{grid-template-columns:1fr}}pre{white-space:pre-wrap;background:#f2eee6;padding:12px;border-radius:8px}
fieldset{border:0;padding:0;display:flex;flex-wrap:wrap;gap:12px;align-items:center}input[type=text]{flex:1;min-width:200px;padding:8px}
button{font:inherit;padding:10px 16px;border-radius:8px;border:0;background:#17161a;color:#fff;cursor:pointer}</style></head><body>
<h1>Blind review</h1><p>For each pair, pick the output this person would rather post or use. You don't know which system wrote which. When done, download your ratings and send the file back.</p>
${items.join("\n")}
<p><button id="dl">Download ratings (CSV)</button></p>
<script>document.getElementById("dl").onclick=function(){var rows=[["id","choice","comment"]];document.querySelectorAll("section").forEach(function(s,i){var c=s.querySelector("input[name=r"+i+"]:checked");rows.push([s.dataset.id,c?c.value:"",(s.querySelector("input[name=c"+i+"]").value||"").replace(/"/g,'""')]);});var csv=rows.map(function(r){return r.map(function(x){return '"'+x+'"'}).join(",")}).join("\\n");var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="ratings.csv";a.click();};</script>
</body></html>`;
  return { html, key };
}

export function writeRun(dir: string, reports: FunctionReport[], md: string, seed: number): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "report.md"), md);
  writeFileSync(join(dir, "results.json"), JSON.stringify(reports, null, 2));
  const pairs = reports.flatMap((r) => r.pairs);
  if (pairs.length) {
    const kit = humanReviewKit(pairs, seed);
    writeFileSync(join(dir, "human-review.html"), kit.html);
    writeFileSync(join(dir, "human-review-key.json"), JSON.stringify(kit.key, null, 2));
  }
}
