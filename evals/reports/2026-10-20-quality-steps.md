# Quality bar: quality-steps-final

Run 2026-10-20 08:05 · seed 1 · Claude Opus 5.5 via OpenRouter for the product, the baseline and the grader · total cost $1.16 (cap $2.23)

Product = the full pipeline (prompts, checks, style notebook). Baseline = the strongest single prompt on the same model with the same facts. Win rates are from blind comparisons in both orders; a win needs both orders to agree.

Quality steps under test: verifyWins,verifyIdeas,draftCandidates=3.

> **Stopped early:** the OpenRouter account ran out of credit, so later cases were not run or graded. Rerun with EVAL_REUSE to keep what finished.

## Summary

| Function | Cases | Win rate vs baseline | Gate | Errors | Cost |
|---|---|---|---|---|---|
| draft | 14 | 86% (60%–96%, n=14) | Pass | 0 | $0.45 |
| extract | 16 (+11 skipped: budget) | 50% (15%–85%, n=4) | **Fail** | 1 | $0.71 |
| ideas | 7 (+10 skipped: budget) | – | – | 0 | $0.00 |

## draft

**Gate:** Wins at least 60% against the baseline, interval above 50%: pass

**Win rate:** 86% (60%–96%, n=14) (10 wins, 4 ties, 0 losses)

| Criterion | Win rate |
|---|---|
| Sounds like them | 89% (64%–97%, n=14) |
| Specific and credible | 64% (39%–84%, n=14) |
| Lands well with leadership and clients | 57% (33%–79%, n=14) |
| Useful to the reader | 46% (24%–70%, n=14) |
| Safe | 57% (33%–79%, n=14) |
| Ready to post | 86% (60%–96%, n=14) |

| Measure | Product | Baseline |
|---|---|---|
| Posts with a rule breach | 0% (0%–22%, n=14) | 0% (0%–22%, n=14) |
| Posts with an invented figure | 0% (0%–22%, n=14) | 0% (0%–22%, n=14) |
| Length 120–220 words | 100% (78%–100%, n=14) | 100% (78%–100%, n=14) |
| First line under 140 characters | 100% (78%–100%, n=14) | 100% (78%–100%, n=14) |
| Cliché or AI-tell phrases per post | 0.00 | 0.00 |

Cost: product $0.00, baseline $0.00, grading $0.45. Reused from an earlier run: 14 product and 14 baseline outputs, 7 gradings.

## extract

**Gate:** Wins at least 60% against the baseline, interval above 50%: **fail**

**Win rate:** 50% (15%–85%, n=4) (1 wins, 2 ties, 1 losses)

| Criterion | Win rate |
|---|---|
| Faithful | 75% (30%–95%, n=4) |
| Complete | 50% (15%–85%, n=4) |
| Useful | 13% (1%–60%, n=4) |
| Follow-up question | 50% (15%–85%, n=4) |

| Measure | Product | Baseline |
|---|---|---|
| Win count within expected range | 94% (72%–99%, n=16) | 100% (81%–100%, n=16) |
| Invented metrics per note | 0.00 | 0.00 |
| Confidential flag correct | 94% (72%–99%, n=16) | 100% (81%–100%, n=16) |
| Names leaked into stored text (per note) | 0.00 | 0.00 |
| Asks a follow-up when it helps | 100% (61%–100%, n=6) | 100% (61%–100%, n=6) |
| Holds back when it doesn't | 20% (6%–51%, n=10) | 20% (6%–51%, n=10) |

Cost: product $0.31, baseline $0.24, grading $0.15. Reused from an earlier run: 4 product and 4 baseline outputs, 0 gradings.

Errors (1): judge note-085: 402 {"type":"error","error":{"type":"billing_error","message":"This request would exceed your available credits given your current in-flight requests. Retry after in-flight requests settle, or add credits.","error_type":"payment_required"},"request_id":"gen-1792483805-RCCcCK7X7UXUW9ZrQqwa","metadata

## ideas

| Measure | Product | Baseline |
|---|---|---|
| Ideas citing a missing or no win | 0.00 | 0.00 |
| Distinct formats (of 3) | 3.00 | 3.00 |
| Rule breaches in hooks and angles | 0.00 | 0.00 |

Cost: product $0.00, baseline $0.00, grading $0.00. Reused from an earlier run: 7 product and 7 baseline outputs, 0 gradings.
