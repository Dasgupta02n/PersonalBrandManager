# Quality bar: fact-checkers

Run 2026-10-20 12:55 · seed 1 · Claude Opus 5.5 via OpenRouter for the product, the baseline and the grader · total cost $1.33 (cap $1.6)

Product = the full pipeline (prompts, checks, style notebook). Baseline = the strongest single prompt on the same model with the same facts. Win rates are from blind comparisons in both orders; a win needs both orders to agree.

Quality steps under test: verifyWins,verifyIdeas.


## Summary

| Function | Cases | Win rate vs baseline | Gate | Errors | Cost |
|---|---|---|---|---|---|
| extract | 16 | 63% (39%–82%, n=16) | **Fail** | 0 | $0.54 |
| ideas | 10 | 50% (24%–76%, n=10) | **Fail** | 0 | $0.79 |

## extract

**Gate:** Wins at least 60% against the baseline, interval above 50%: **fail**

**Win rate:** 63% (39%–82%, n=16) (8 wins, 4 ties, 4 losses)

| Criterion | Win rate |
|---|---|
| Faithful | 69% (44%–86%, n=16) |
| Complete | 50% (28%–72%, n=16) |
| Useful | 50% (28%–72%, n=16) |
| Follow-up question | 53% (31%–74%, n=16) |

| Measure | Product | Baseline |
|---|---|---|
| Win count within expected range | 94% (72%–99%, n=16) | 100% (81%–100%, n=16) |
| Invented metrics per note | 0.00 | 0.00 |
| Confidential flag correct | 94% (72%–99%, n=16) | 100% (81%–100%, n=16) |
| Names leaked into stored text (per note) | 0.00 | 0.00 |
| Asks a follow-up when it helps | 100% (61%–100%, n=6) | 100% (61%–100%, n=6) |
| Holds back when it doesn't | 20% (6%–51%, n=10) | 20% (6%–51%, n=10) |

Cost: product $0.00, baseline $0.00, grading $0.54. Reused from an earlier run: 16 product and 16 baseline outputs, 4 gradings.

## ideas

**Gate:** Wins at least 60% against the baseline, interval above 50%: **fail**

**Win rate:** 50% (24%–76%, n=10) (4 wins, 2 ties, 4 losses)

| Criterion | Win rate |
|---|---|
| Grounded | 85% (54%–96%, n=10) |
| Worth posting | 25% (8%–56%, n=10) |
| Useful to the reader | 20% (6%–51%, n=10) |
| Safe | 50% (24%–76%, n=10) |
| First lines | 50% (24%–76%, n=10) |

| Measure | Product | Baseline |
|---|---|---|
| Ideas citing a missing or no win | 0.00 | 0.00 |
| Distinct formats (of 3) | 3.00 | 3.00 |
| Rule breaches in hooks and angles | 0.00 | 0.00 |

Cost: product $0.17, baseline $0.00, grading $0.62. Reused from an earlier run: 7 product and 10 baseline outputs, 0 gradings.
