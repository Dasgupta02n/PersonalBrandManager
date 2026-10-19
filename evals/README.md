# The quality bar

Every AI function must be visibly better than the strongest single prompt a capable person could
write for the same model. This harness measures that.

- **Product:** the full pipeline in `src/lib/ai/tasks.ts`, with its prompts, plain-code checks,
  AI review and the style notebook.
- **Baseline** (`lib/baselines.ts`): one carefully engineered prompt per function on the same
  model (Claude Opus 5.5) at high effort. It gets everything a user could paste: the same facts,
  rules, sample posts and style notes. It does not get the product's prompts, checks or extra
  steps.
- **Test sets** (`data/`): synthetic cases with fictional people and companies, never user data
  (see `AUTHORING.md`).

| Function | Test set | How it is judged |
|---|---|---|
| `extract` (wins from a note) | 200 notes | Win count, invented metrics, confidential flag, names kept out, follow-up questions; blind grading |
| `ideas` | 60 records | Grounding, formats, rule breaches; blind grading |
| `draft` | 300 ideas | Rule breaches, invented figures, length, first line, clichés; blind grading |
| `check` (safety) | 100 risky + 40 clean posts | Catch rate per risk type, false alarms on clean posts |
| `reads` (how it reads) | 60 labelled posts | Verdict accuracy, per verdict |
| `revision` | 60 revisions | Did what was asked, invented figures; blind grading |
| `comments` | 60 posts | Empty praise, length; blind grading |
| `profile` | 24 records | Headline length, rule breaches, invented figures; blind grading |
| `voice` (style notebook) | 24 edit histories | Expected traits captured, content leaking into notes; blind grading |

## Pass rules

- **Writing functions:** the product must win at least 60% of blind comparisons against the
  baseline (ties count half), with the 95% interval above 50%.
- **Safety check:** it must catch every risk in at least 95% of risky posts, with false alarms
  on at most 20% of clean posts.
- **How it reads:** at least 80% of verdicts correct, and no worse than the baseline.

No change to prompts, models or pipeline ships unless it passes, against both the current
version and the baseline.

## Running it

It needs `OPENROUTER_API_KEY` in the environment. Every call costs real money and is recorded
in the report.

```bash
npm run eval                                        # every function, 40 cases each (about $43)
EVAL_FUNCTIONS=draft,check npm run eval              # some functions
EVAL_LIMIT=0 npm run eval                            # every case (about $122)
EVAL_ESTIMATE=1 npm run eval                         # print the cost estimate only
EVAL_DRY_RUN=1 npm run eval                          # stand-in answers: checks the harness, costs nothing
EVAL_LABEL=notebook-v2 EVAL_SEED=1 npm run eval      # name a run; keep the seed to compare runs
```

Each run writes `evals/out/<date>-<label>/`:
- `report.md`: summary, pass or fail per function, win rates per criterion, metrics, costs;
- `results.json`: every case;
- `human-review.html` and `human-review-key.json`: the expert review kit.

Commit the reports you want to keep to `evals/reports/`.

## How grading works

- **Blind, in both orders.** The grader (`lib/judge.ts`) sees the persona, the source facts and
  two outputs labelled only A and B. It judges each criterion, then judges the pair again with
  the order swapped. A side wins only when both orders agree; otherwise it's a tie. This removes
  the grader's bias towards whichever answer comes first.
- **Same model family.** The grader is the same model family as both sides, so any preference
  for its own style applies to both.
- **Human calibration.** Once a month, send `human-review.html` to two or three experienced
  ghostwriters or senior professionals. They rate the pairs blind in their browser and send back
  `ratings.csv`. If their choices and the grader's disagree on more than about a quarter of
  pairs, fix the rubric before trusting the grader again.

## Limits to keep in mind

- **Synthetic cases.** They were written with AI help, then checked by the validator. Have
  domain experts review a sample, especially the risky posts and the read labels, and fix weak
  cases.
- **Small samples are noisy.** Read the intervals, not just the percentages; 40 cases per
  function separates large differences, not small ones.
- **Estimates only.** Costs are estimates until the first real run; the report shows actual
  spend.
