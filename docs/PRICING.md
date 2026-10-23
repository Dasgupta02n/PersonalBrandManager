# Pricing

One global price in US dollars, the same in every country. Prices exclude sales tax, VAT and
GST; the merchant of record adds them at checkout where the law requires. The model lives in
`src/lib/billing/pricing.ts` and its tests (`pricing.test.ts`) fail if any plan breaks the split.

| Option | Price | Notes |
|---|---|---|
| Membership, monthly | **$30 a month** | |
| Membership, annual | **$330 a year** | Eleven months' price: one month free; $27.50 a month |
| First month (trial) | **$10 for 30 days** | A third of the monthly price |
| Private beta | Free | Member allowance; new sign-ups start here until billing opens |

Set on 2026-10-23 (was $29, $319 and $9.50), when the network was added.

## The split: three equal parts

Payment fees come off first and income tax on the profit is set aside. What is left is divided
into three equal parts:

| Part | What it pays for |
|---|---|
| Cost | AI (OpenRouter), hosting, database, email, domain. A ceiling: the AI allowance is what is left after platform costs |
| Performance marketing | Paid acquisition, the free checker's running cost, trial costs |
| Profit | After income tax |

Profit before tax is a part ÷ (1 − tax rate), so each part is
1 ÷ (2 + 1 ÷ (1 − tax)) = **28.96%** of what payment fees leave, and the income tax reserve is the
remaining 13.13%.

**Payment fees.** Paddle as merchant of record: 5% + $0.50 per charge. It also collects and files
UK VAT, EU VAT, UAE VAT, Singapore GST and India's GST on foreign digital services.

**Income tax reserve.** 31.2% of profit: a sole proprietor at the top slab of India's new regime
(30% plus 4% cess; surcharge applies only above ₹50 lakh of income). A conservative reserve, not
tax advice: presumptive taxation or a company would usually pay less, which leaves more profit.
Change `INCOME_TAX_RATE` and every allowance follows.

**Platform costs.** About $60 a month of fixed costs (VPS $10, a larger VPS or a separate
database server as we grow $25, email $20, domain $1, other $4) shared by 200 paying users, plus
about $0.01 of reminder emails each: **$0.31 per user per month**. Below about 200 payers, fixed
costs take a larger share whatever the price.

## Where each dollar goes, at the full allowance

| Per month | Monthly ($30) | Annual ($27.50/month) | Trial ($10) |
|---|---|---|---|
| Payment fees | $2.00 | $1.42 | $1.00 |
| **Left after fees** | **$28.00** | **$26.08** | **$9.00** |
| Platform | $0.31 | $0.31 | $0.31 |
| AI allowance | $7.24 | $7.24 | $2.29 |
| **Cost** | **$7.55** | **$7.55** | **$2.60** |
| **Performance marketing** | **$8.11** | **$7.55** | **$2.61** |
| Income tax | $3.85 | $3.43 | $1.18 |
| **Profit after tax** | **$8.49** | **$7.55** | **$2.61** |

Members get one allowance whichever way they pay: what the annual price can fund. Monthly payers
therefore leave a little more profit. Members who use less than the allowance, which is most of
them, leave more profit still.

## How the price was set

Every AI function runs on Claude Opus 5.5 via OpenRouter ($4 per million input tokens, $20 per
million output). Token counts per call were measured from the prompts with a full user context
(the two network calls estimated from their prompts), then multiplied by 1.5 for headroom.

| Action | Calls | Cost each | Engaged month | Month cost |
|---|---|---|---|---|
| Daily note | extract wins + fact-check | $0.046 | 22 | $1.01 |
| Post ideas, on request | post ideas | $0.032 | 12 | $0.38 |
| Checked draft | 3 drafts + editor's pick + check + how it reads | $0.208 | 10 | $2.08 |
| Revision | revise + check + how it reads | $0.098 | 10 | $0.98 |
| Re-check after edits | check + how it reads | $0.070 | 6 | $0.42 |
| Comment starters | comment starters | $0.031 | 10 | $0.31 |
| Profile and CV refresh | profile suggestions | $0.074 | 4 | $0.29 |
| Style notebook refresh | voice profile | $0.042 | 2 | $0.08 |
| Network suggestions | network map | $0.058 | 2 | $0.12 |
| Network message | outreach message | $0.035 | 12 | $0.42 |
| **Engaged month** | | | | **$6.09** |

- Firm matches use plain rules, so they cost nothing.
- Today's pipeline needs at least $23.79 a month: (($6.09 + $0.31) ÷ 28.96% + $0.50) ÷ 95%.
- The planned quality pipeline plus the network (about $6.65 an engaged month) needs at least
  **$25.83 a month** and **$304 a year**. $30 and $330 clear both with room for the network to grow.
- The member allowance ($7.24) covers the planned pipeline. At today's costs it is about 34
  checked drafts.
- The trial allowance ($2.29) is about 49 daily notes, or 11 checked drafts.
- Post ideas come when the user asks, not after every note (the first note at sign-up is the
  exception). That pays for the fact-check on every note.

### The planned quality pipeline

| Action | Today | With quality passes, caching and batch |
|---|---|---|
| Checked draft | $0.21 (3 drafts + editor's pick; about $0.18 measured in the quality bar) | about $0.18 (with specialist checkers and a fix pass, cached) |
| Daily note | $0.05 (note and fact-check; ideas on request) | about $0.07 (deeper ideas prepared overnight at batch price) |
| Revision | $0.10 | about $0.11 |
| Re-check | $0.07 | about $0.10 |
| Network (suggestions and messages) | $0.54 a month | about $0.54 |
| **Engaged month** | **$6.09** | **about $6.65** |

These are estimates. Real costs from the beta's `ai_usage` replace them.

## How the allowance is enforced

- The real cost of every AI call is recorded in `ai_usage`: OpenRouter's reported cost, or tokens
  × list price when no cost is reported.
- `requireAllowance` (`src/lib/billing/allowance.ts`) runs before every AI action and stops it
  once the plan's allowance for the period is used.
- Members and beta users get a fresh allowance each calendar month; a trial gets its 30 days once.
- Notes are always saved first, so the record has no gaps when the allowance runs out. Network
  answers and contacts are saved even when suggestions can't be built.
- Today shows one calm note from 80% used. There is no credit counter anywhere.
- The plan lives in `subscriptions`, which users can read but never change. Billing webhooks will
  write it.

## If you change something

- **A different model for a function** (`AI_MODEL_<TASK>`): costs fall and the allowance stays
  the same, so margin rises. Re-measure and raise the allowance if you want users to get more.
- **Different price, tax rate or fees:** edit the constants; allowances are derived from them.
- **A free trial instead of a paid one:** set the trial price to $0 and pay its cost ($2.60) from
  the marketing part.
