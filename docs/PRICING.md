# Pricing

One global price in US dollars, the same in every country. Prices exclude sales tax, VAT and
GST; the merchant of record adds them at checkout where the law requires. The model lives in
`src/lib/billing/pricing.ts` and its tests (`pricing.test.ts`) fail if any plan breaks the split.

| Option | Price | Notes |
|---|---|---|
| Membership, monthly | **$29 a month** | |
| Membership, annual | **$319 a year** | One month free; $26.58 a month |
| First month (trial) | **$9.50 for 30 days** | 33% of the monthly price, with 33% of a member's input cost |
| Private beta | Free | Member allowance; new sign-ups start here until billing opens |

The price is set to fund the multi-pass quality pipeline (several drafts and a grader,
specialist safety checkers): about **$6.10** of AI for an engaged month once it is built, with
caching and overnight batch. Today's pipeline, with three drafts and an editor's pick for every
draft, costs $5.55 for the same month, so members have headroom until the rest is built.

## The split

Every price is divided the same way:

| Share | Of revenue | What it pays for |
|---|---|---|
| Input cost | 29.9% (ceiling) | Payment fees, AI (OpenRouter), hosting, database, email, domain |
| Performance marketing | 30% | Paid acquisition, the free checker's running cost, trial costs |
| Income tax | 10.1% | 25.17% of pre-tax profit |
| Profit after tax | 30% | |

**Income tax.** Assumes an Indian domestic company taxed under section 115BAA: 22% + 10%
surcharge + 4% cess = 25.168%. Marketing and input costs are deductible, so pre-tax profit is
40.1% of revenue, tax is 10.1% and 30% remains. Input cost is therefore capped at
1 − 30% − 30% ÷ (1 − 25.168%) = **29.91%**. (A sole proprietor at the top slab pays more; change
`INCOME_TAX_RATE` and every allowance follows.)

**Payment fees.** Paddle as merchant of record: 5% + $0.50 per charge. It also collects and files
UK VAT, EU VAT, UAE VAT, Singapore GST and India's GST on foreign digital services.

**Platform costs.** About $60 a month of fixed costs (VPS $10, Supabase Pro $25, email $20,
domain $1, other $4) shared by 200 paying users, plus about $0.01 of reminder emails each:
**$0.31 per user per month**. Below about 200 payers, fixed costs take a larger share whatever
the price.

## Where each dollar goes, at the full allowance

| Per month | Monthly ($29) | Annual ($26.58/month) | Trial ($9.50) |
|---|---|---|---|
| Payment fees | $1.95 | $1.37 | $0.98 |
| Platform | $0.31 | $0.31 | $0.31 |
| AI allowance | $6.27 | $6.27 | $1.55 |
| **Input cost** | **$8.53 (29.4%)** | **$7.95 (29.9%)** | **$2.83 (29.8%)** |
| Marketing | $8.70 | $7.97 | $2.85 |
| Income tax | $2.96 | $2.68 | $0.96 |
| **Profit after tax** | **$8.81 (30.4%)** | **$7.98 (30.0%)** | **$2.85 (30.1%)** |

Members get one allowance whichever way they pay: what the annual price can fund. Monthly payers
therefore leave a little more profit. Members who use less than the allowance, which is most of
them, leave more profit still.

## How the price was set

Two numbers set it: what today's pipeline costs, and what the planned quality pipeline will
cost. Every AI function runs on Claude Opus 5.5 via OpenRouter ($4 per million input tokens, $20 per
million output). Token counts per call were measured from the prompts with a full user context,
then multiplied by 1.5 for headroom.

| Action | Calls | Cost each | Engaged month | Month cost |
|---|---|---|---|---|
| Daily note | extract wins + post ideas | $0.057 | 22 | $1.26 |
| More ideas | post ideas | $0.032 | 4 | $0.13 |
| Checked draft | 3 drafts + editor's pick + check + how it reads | $0.208 | 10 | $2.08 |
| Revision | revise + check + how it reads | $0.098 | 10 | $0.98 |
| Re-check after edits | check + how it reads | $0.070 | 6 | $0.42 |
| Comment starters | comment starters | $0.031 | 10 | $0.31 |
| Profile and CV refresh | profile suggestions | $0.074 | 4 | $0.29 |
| Style notebook refresh | voice profile | $0.042 | 2 | $0.08 |
| **Engaged month** | | | | **$5.55** |

- Today's pipeline needs at least $25.54 a month: ($5.55 + $0.31 + $0.50) ÷ (29.91% − 5%).
- The quality pipeline ($6.10 an engaged month, see below) needs at least **$27.70 a month**
  and **$311 a year**. $29 and $319 are the nearest standard price points that clear both.
- The member allowance ($6.27) covers the planned pipeline. At today's costs it is about 30
  checked drafts.
- The trial allowance ($1.55) is about 27 daily notes, or 7 checked drafts.

### The planned quality pipeline

| Action | Today | With quality passes, caching and batch |
|---|---|---|
| Checked draft | $0.21 (3 drafts + editor's pick; about $0.18 measured in the quality bar) | about $0.18 (with specialist checkers and a fix pass, cached) |
| Daily note | $0.06 | about $0.07 (deeper ideas prepared overnight at batch price) |
| Revision | $0.10 | about $0.11 |
| Re-check | $0.07 | about $0.10 |
| **Engaged month** | **$5.55** | **about $6.10** |

These are estimates. Real costs from the beta's `ai_usage` replace them.

## How the allowance is enforced

- The real cost of every AI call is recorded in `ai_usage`: OpenRouter's reported cost, or tokens
  × list price when no cost is reported.
- `requireAllowance` (`src/lib/billing/allowance.ts`) runs before every AI action and stops it
  once the plan's allowance for the period is used.
- Members and beta users get a fresh allowance each calendar month; a trial gets its 30 days once.
- Notes are always saved first, so the record has no gaps when the allowance runs out.
- Today shows one calm note from 80% used. There is no credit counter anywhere.
- The plan lives in `subscriptions`, which users can read but never change. Billing webhooks will
  write it.

## If you change something

- **A different model for a function** (`AI_MODEL_<TASK>`): costs fall and the allowance stays
  the same, so margin rises. Re-measure and raise the allowance if you want users to get more.
- **Different price, tax rate or fees:** edit the constants; allowances are derived from them.
- **A free trial instead of a paid one:** set the trial price to $0 and pay its input cost
  ($2.83) from the marketing share.
