# Quality bar: after-fixes

Run 2026-10-20 04:40 · seed 1 · Claude Opus 5.5 via OpenRouter for the product, the baseline and the grader · total cost $10.53 (cap $12)

Product = the full pipeline (prompts, checks, style notebook). Baseline = the strongest single prompt on the same model with the same facts. Win rates are from blind comparisons in both orders; a win needs both orders to agree.

## Summary

| Function | Cases | Win rate vs baseline | Gate | Errors | Cost |
|---|---|---|---|---|---|
| check | 60 | – | **Fail** | 0 | $2.75 |
| draft | 20 | 70% (48%–85%, n=20) | **Fail** | 0 | $3.39 |
| extract | 20 | 13% (4%–33%, n=20) | **Fail** | 0 | $1.44 |
| ideas | 12 | 58% (32%–81%, n=12) | **Fail** | 0 | $1.45 |
| revision | 9 | 56% (27%–81%, n=9) | **Fail** | 0 | $1.50 |

## check

**Gate:** Catches every risk in at least 95% of risky posts, false alarms at most 20%: **fail**

| Measure | Product | Baseline |
|---|---|---|
| Risky posts caught (at least one real risk) | 100% (92%–100%, n=46) | 100% (92%–100%, n=46) |
| Risky posts fully caught (every risk) | 100% (92%–100%, n=46) | 100% (92%–100%, n=46) |
| False alarms on clean posts | 86% (60%–96%, n=14) | 43% (21%–67%, n=14) |
| Caught: confidential_client | 100% (74%–100%, n=11) | 100% (74%–100%, n=11) |
| Caught: hierarchy | 100% (34%–100%, n=2) | 100% (34%–100%, n=2) |
| Caught: internal_figure | 100% (70%–100%, n=9) | 100% (70%–100%, n=9) |
| Caught: job_search | 100% (61%–100%, n=6) | 100% (61%–100%, n=6) |
| Caught: no_go_topic | 100% (57%–100%, n=5) | 100% (57%–100%, n=5) |
| Caught: regulated_promissory | 100% (51%–100%, n=4) | 100% (51%–100%, n=4) |
| Caught: unannounced | 100% (68%–100%, n=8) | 100% (68%–100%, n=8) |
| Caught: unsupported_claim | 100% (68%–100%, n=8) | 100% (68%–100%, n=8) |

Cost: product $1.69, baseline $1.06, grading $0.00.

## draft

**Gate:** Wins at least 60% against the baseline, interval above 50%: **fail**

**Win rate:** 70% (48%–85%, n=20) (13 wins, 2 ties, 5 losses)

| Criterion | Win rate |
|---|---|
| Sounds like them | 83% (61%–93%, n=20) |
| Specific and credible | 68% (46%–84%, n=20) |
| Lands well with leadership and clients | 43% (24%–64%, n=20) |
| Useful to the reader | 15% (5%–36%, n=20) |
| Safe | 43% (24%–64%, n=20) |
| Ready to post | 70% (48%–85%, n=20) |

| Measure | Product | Baseline |
|---|---|---|
| Posts with a rule breach | 0% (0%–16%, n=20) | 0% (0%–16%, n=20) |
| Posts with an invented figure | 0% (0%–16%, n=20) | 0% (0%–16%, n=20) |
| Length 120–220 words | 100% (84%–100%, n=20) | 100% (84%–100%, n=20) |
| First line under 140 characters | 100% (84%–100%, n=20) | 95% (76%–99%, n=20) |
| Cliché or AI-tell phrases per post | 0.00 | 0.00 |

Cost: product $1.46, baseline $0.61, grading $1.33.

## extract

**Gate:** Wins at least 60% against the baseline, interval above 50%: **fail**

**Win rate:** 13% (4%–33%, n=20) (0 wins, 5 ties, 15 losses)

| Criterion | Win rate |
|---|---|
| Faithful | 63% (41%–80%, n=20) |
| Complete | 43% (24%–64%, n=20) |
| Useful | 25% (11%–47%, n=20) |
| Follow-up question | 13% (4%–33%, n=20) |

| Measure | Product | Baseline |
|---|---|---|
| Win count within expected range | 85% (64%–95%, n=20) | 95% (76%–99%, n=20) |
| Invented metrics per note | 0.00 | 0.00 |
| Confidential flag correct | 85% (64%–95%, n=20) | 95% (76%–99%, n=20) |
| Names leaked into stored text (per note) | 0.00 | 0.10 |
| Asks a follow-up when it helps | 86% (49%–97%, n=7) | 100% (65%–100%, n=7) |
| Holds back when it doesn't | 100% (77%–100%, n=13) | 23% (8%–50%, n=13) |

Cost: product $0.25, baseline $0.37, grading $0.82.

## ideas

**Gate:** Wins at least 60% against the baseline, interval above 50%: **fail**

**Win rate:** 58% (32%–81%, n=12) (6 wins, 2 ties, 4 losses)

| Criterion | Win rate |
|---|---|
| Grounded | 92% (65%–99%, n=12) |
| Worth posting | 21% (7%–49%, n=12) |
| Useful to the reader | 13% (3%–40%, n=12) |
| Safe | 54% (29%–78%, n=12) |
| First lines | 50% (25%–75%, n=12) |

| Measure | Product | Baseline |
|---|---|---|
| Ideas citing a missing or no win | 0.00 | 0.00 |
| Distinct formats (of 3) | 3.00 | 3.00 |
| Rule breaches in hooks and angles | 0.00 | 0.00 |

Cost: product $0.32, baseline $0.38, grading $0.76.

## revision

**Gate:** Wins at least 60% against the baseline, interval above 50%: **fail**

**Win rate:** 56% (27%–81%, n=9) (4 wins, 2 ties, 3 losses)

| Criterion | Win rate |
|---|---|
| Did what was asked | 61% (31%–85%, n=9) |
| Kept the facts | 44% (19%–73%, n=9) |
| Better post | 56% (27%–81%, n=9) |

| Measure | Product | Baseline |
|---|---|---|
| Did what was asked | 67% (35%–88%, n=9) | 89% (56%–98%, n=9) |
| Revisions with an invented figure | 0% (0%–30%, n=9) | 0% (0%–30%, n=9) |

Cost: product $0.77, baseline $0.26, grading $0.47.
