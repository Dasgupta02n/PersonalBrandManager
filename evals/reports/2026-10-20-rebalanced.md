# Quality bar: rebalanced

Run 2026-10-20 07:37 · seed 1 · Claude Opus 5.5 via OpenRouter for the product, the baseline and the grader · total cost $4.90 (cap $5.6)

Product = the full pipeline (prompts, checks, style notebook). Baseline = the strongest single prompt on the same model with the same facts. Win rates are from blind comparisons in both orders; a win needs both orders to agree.

## Summary

| Function | Cases | Win rate vs baseline | Gate | Errors | Cost |
|---|---|---|---|---|---|
| check | 60 | – | Pass | 0 | $0.40 |
| draft | 16 | 72% (47%–88%, n=16) | **Fail** | 0 | $2.24 |
| extract | 20 | 48% (28%–68%, n=20) | **Fail** | 0 | $1.15 |
| ideas | 12 | 46% (22%–71%, n=12) | **Fail** | 0 | $1.11 |

## check

**Gate:** Catches every risk in at least 95% of risky posts, false alarms at most 20%: pass

| Measure | Product | Baseline |
|---|---|---|
| Risky posts caught (at least one real risk) | 100% (92%–100%, n=46) | 100% (92%–100%, n=46) |
| Risky posts fully caught (every risk) | 100% (92%–100%, n=46) | 100% (92%–100%, n=46) |
| False alarms on clean posts (any flag) | 7% (1%–31%, n=14) | 0% (0%–22%, n=14) |
| …that would stop or rewrite the post | 0% (0%–22%, n=14) | 0% (0%–22%, n=14) |
| …notes only (grounding or credit) | 7% (1%–31%, n=14) | 0% (0%–22%, n=14) |
| Caught: confidential_client | 100% (74%–100%, n=11) | 100% (74%–100%, n=11) |
| Caught: hierarchy | 100% (34%–100%, n=2) | 100% (34%–100%, n=2) |
| Caught: internal_figure | 100% (70%–100%, n=9) | 100% (70%–100%, n=9) |
| Caught: job_search | 100% (61%–100%, n=6) | 100% (61%–100%, n=6) |
| Caught: no_go_topic | 100% (57%–100%, n=5) | 100% (57%–100%, n=5) |
| Caught: regulated_promissory | 100% (51%–100%, n=4) | 100% (51%–100%, n=4) |
| Caught: unannounced | 100% (68%–100%, n=8) | 100% (68%–100%, n=8) |
| Caught: unsupported_claim | 100% (68%–100%, n=8) | 100% (68%–100%, n=8) |

Cost: product $0.22, baseline $0.18, grading $0.00. Reused from an earlier run: 46 product and 46 baseline outputs.

## draft

**Gate:** Wins at least 60% against the baseline, interval above 50%: **fail**

**Win rate:** 72% (47%–88%, n=16) (10 wins, 3 ties, 3 losses)

| Criterion | Win rate |
|---|---|
| Sounds like them | 75% (51%–90%, n=16) |
| Specific and credible | 72% (47%–88%, n=16) |
| Lands well with leadership and clients | 66% (41%–84%, n=16) |
| Useful to the reader | 16% (5%–40%, n=16) |
| Safe | 53% (31%–74%, n=16) |
| Ready to post | 75% (51%–90%, n=16) |

| Measure | Product | Baseline |
|---|---|---|
| Posts with a rule breach | 0% (0%–19%, n=16) | 0% (0%–19%, n=16) |
| Posts with an invented figure | 0% (0%–19%, n=16) | 0% (0%–19%, n=16) |
| Length 120–220 words | 100% (81%–100%, n=16) | 100% (81%–100%, n=16) |
| First line under 140 characters | 100% (81%–100%, n=16) | 100% (81%–100%, n=16) |
| Cliché or AI-tell phrases per post | 0.00 | 0.00 |

Cost: product $1.19, baseline $0.00, grading $1.05. Reused from an earlier run: 0 product and 16 baseline outputs.

## extract

**Gate:** Wins at least 60% against the baseline, interval above 50%: **fail**

**Win rate:** 48% (28%–68%, n=20) (6 wins, 7 ties, 7 losses)

| Criterion | Win rate |
|---|---|
| Faithful | 23% (10%–44%, n=20) |
| Complete | 45% (26%–66%, n=20) |
| Useful | 75% (53%–89%, n=20) |
| Follow-up question | 45% (26%–66%, n=20) |

| Measure | Product | Baseline |
|---|---|---|
| Win count within expected range | 95% (76%–99%, n=20) | 95% (76%–99%, n=20) |
| Invented metrics per note | 0.00 | 0.00 |
| Confidential flag correct | 90% (70%–97%, n=20) | 95% (76%–99%, n=20) |
| Names leaked into stored text (per note) | 0.00 | 0.10 |
| Asks a follow-up when it helps | 100% (65%–100%, n=7) | 100% (65%–100%, n=7) |
| Holds back when it doesn't | 23% (8%–50%, n=13) | 23% (8%–50%, n=13) |

Cost: product $0.29, baseline $0.00, grading $0.86. Reused from an earlier run: 0 product and 20 baseline outputs.

## ideas

**Gate:** Wins at least 60% against the baseline, interval above 50%: **fail**

**Win rate:** 46% (22%–71%, n=12) (3 wins, 5 ties, 4 losses)

| Criterion | Win rate |
|---|---|
| Grounded | 46% (22%–71%, n=12) |
| Worth posting | 33% (14%–61%, n=12) |
| Useful to the reader | 38% (16%–65%, n=12) |
| Safe | 50% (25%–75%, n=12) |
| First lines | 67% (39%–86%, n=12) |

| Measure | Product | Baseline |
|---|---|---|
| Ideas citing a missing or no win | 0.00 | 0.00 |
| Distinct formats (of 3) | 3.00 | 3.00 |
| Rule breaches in hooks and angles | 0.00 | 0.00 |

Cost: product $0.34, baseline $0.00, grading $0.77. Reused from an earlier run: 0 product and 12 baseline outputs.
