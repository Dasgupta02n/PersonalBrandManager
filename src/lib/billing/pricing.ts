// One global price, in US dollars, the same in every country. Prices exclude sales tax, VAT and
// GST, which the merchant of record adds at checkout where the law requires it.
//
// Every price is split the same way:
//   30% input cost (payment fees, AI, hosting, database, email, domain)
//   30% performance marketing
//   30% profit after income tax
//   the income tax on that profit (about 10% of the price)
// Input cost is a ceiling: each plan's monthly AI allowance is what is left of the input share
// after payment fees and platform costs, so a member who uses the whole allowance still leaves
// the other shares intact. Members who use less leave more profit.

export const CURRENCY = "USD";

export const SPLIT = { marketing: 0.3, profitAfterTax: 0.3 } as const;

/** India, domestic company taxed under section 115BAA: 22% plus a 10% surcharge and 4% cess. */
export const INCOME_TAX_RATE = 0.22 * 1.1 * 1.04;

/** Merchant of record (Paddle): 5% plus $0.50 per charge. It collects and files sales tax. */
export const PAYMENT_FEE = { rate: 0.05, fixedUsd: 0.5 } as const;

/**
 * Hosting, database, email and domain per paying user per month: about $60 a month of fixed
 * costs (VPS $10, Supabase Pro $25, email $20, domain $1, other $4) shared by 200 paying users,
 * plus about $0.01 of reminder emails each. Below about 200 payers fixed costs take a larger share.
 */
export const PLATFORM_COST_PER_USER_MONTH = 0.31;

/** Share of revenue left for input costs once marketing and after-tax profit are set aside. */
export const INPUT_SHARE = 1 - SPLIT.marketing - SPLIT.profitAfterTax / (1 - INCOME_TAX_RATE);

export type BillingOption = "monthly" | "annual" | "trial";

// Sized for the multi-pass quality pipeline (several drafts and a grader, specialist checkers),
// which costs about PLANNED_ENGAGED_MONTH_USD a month with caching and overnight batch.
export const PRICES: Record<BillingOption, { usd: number; months: number }> = {
  monthly: { usd: 29, months: 1 },
  annual: { usd: 319, months: 12 },
  // About a third (33%) of the monthly price for the first 30 days, with a third of the input cost.
  trial: { usd: 9.5, months: 1 },
};

/** Estimated AI cost of an engaged month once the quality pipeline is built (docs/PRICING.md). */
export const PLANNED_ENGAGED_MONTH_USD = 6.1;

/** Months free when paying yearly, against twelve monthly payments. */
export function annualMonthsFree(): number {
  return Math.round(12 - PRICES.annual.usd / PRICES.monthly.usd);
}

export const TRIAL_DAYS = 30;

export type PlanKind = "beta" | "trial" | "member";

export interface Breakdown {
  /** Revenue per month, before sales tax. */
  revenue: number;
  paymentFees: number;
  platform: number;
  ai: number;
  inputCost: number;
  marketing: number;
  incomeTax: number;
  profit: number;
}

const perMonth = (option: BillingOption) => PRICES[option].usd / PRICES[option].months;
const feesPerMonth = (option: BillingOption) =>
  (PRICES[option].usd * PAYMENT_FEE.rate + PAYMENT_FEE.fixedUsd) / PRICES[option].months;
const floorCents = (usd: number) => Math.floor(usd * 100 + 1e-9) / 100;

/** AI spend a billing option can fund each month while input cost stays within its share. */
export function aiBudget(option: BillingOption): number {
  return INPUT_SHARE * perMonth(option) - feesPerMonth(option) - PLATFORM_COST_PER_USER_MONTH;
}

/**
 * Monthly AI allowance per plan, in US dollars of actual model cost. Members get what the
 * annual price can fund (the lower of monthly and annual), so input cost stays within its share
 * on every billing option. Beta users get the member allowance.
 */
export const AI_ALLOWANCE_USD: Record<PlanKind, number> = (() => {
  const member = floorCents(Math.min(aiBudget("monthly"), aiBudget("annual")));
  return { beta: member, member, trial: floorCents(aiBudget("trial")) };
})();

/** Where each dollar goes for a billing option, per month, if `ai` dollars of AI are used. */
export function breakdown(option: BillingOption, ai: number = AI_ALLOWANCE_USD[option === "trial" ? "trial" : "member"]): Breakdown {
  const revenue = perMonth(option);
  const paymentFees = feesPerMonth(option);
  const platform = PLATFORM_COST_PER_USER_MONTH;
  const inputCost = paymentFees + platform + ai;
  const marketing = SPLIT.marketing * revenue;
  const preTax = revenue - inputCost - marketing;
  const incomeTax = Math.max(preTax, 0) * INCOME_TAX_RATE;
  return { revenue, paymentFees, platform, ai, inputCost, marketing, incomeTax, profit: preTax - incomeTax };
}

// ---------------------------------------------------------------------------
// What the allowance buys. Estimates only: the allowance is enforced on the real cost of
// each call, which OpenRouter reports and `ai_usage` records.
// ---------------------------------------------------------------------------

/** OpenRouter list prices, US dollars per million tokens. Unknown models are costed as Opus. */
export const MODEL_PRICES: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "anthropic/claude-opus-5.5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  "anthropic/claude-sonnet-5.5": { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 },
  "anthropic/claude-haiku-5.5": { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
};

export function estimateCallCost(
  model: string,
  tokens: { input: number; output: number; cacheRead?: number; cacheWrite?: number },
): number {
  const price = MODEL_PRICES[model.replace(/-\d{8}$/, "")] ?? MODEL_PRICES["anthropic/claude-opus-5.5"];
  return (
    (tokens.input * price.input +
      tokens.output * price.output +
      (tokens.cacheRead ?? 0) * price.cacheRead +
      (tokens.cacheWrite ?? 0) * price.cacheWrite) /
    1e6
  );
}

/** Typical tokens per call (input, output), measured from the prompts with a full user context. */
const CALL_TOKENS = {
  extract_wins: [2050, 450],
  post_ideas: [2750, 500],
  draft_post: [2080, 700],
  check_draft: [2400, 800],
  how_it_reads: [2250, 600],
  revise_draft: [2400, 450],
  comment_starters: [2650, 500],
  profile_suggestions: [4750, 1500],
} as const;

/** Headroom for longer notes, larger records and higher-effort answers. */
const ESTIMATE_SAFETY = 1.5;

const ACTION_CALLS = {
  log: ["extract_wins", "post_ideas"],
  moreIdeas: ["post_ideas"],
  draft: ["draft_post", "check_draft", "how_it_reads"],
  revision: ["revise_draft", "check_draft", "how_it_reads"],
  recheck: ["check_draft", "how_it_reads"],
  commentStarters: ["comment_starters"],
  profileRefresh: ["profile_suggestions"],
} as const satisfies Record<string, readonly (keyof typeof CALL_TOKENS)[]>;

export type Action = keyof typeof ACTION_CALLS;

/** Estimated cost of one user action on Claude Opus 5.5, every function's pinned model. */
export function actionCost(action: Action): number {
  return ACTION_CALLS[action].reduce((sum, task) => {
    const [input, output] = CALL_TOKENS[task];
    return sum + estimateCallCost("anthropic/claude-opus-5.5", { input, output }) * ESTIMATE_SAFETY;
  }, 0);
}

/** An engaged member's month: the usage the member price is built to cover. */
export const ENGAGED_MONTH: Record<Action, number> = {
  log: 22,
  moreIdeas: 4,
  draft: 10,
  revision: 10,
  recheck: 6,
  commentStarters: 10,
  profileRefresh: 4,
};

export function monthCost(usage: Partial<Record<Action, number>>): number {
  return Object.entries(usage).reduce((sum, [action, count]) => sum + actionCost(action as Action) * (count ?? 0), 0);
}

/** The lowest monthly price whose input share covers an engaged month. */
export function monthlyPriceFloor(): number {
  const cost = monthCost(ENGAGED_MONTH) + PLATFORM_COST_PER_USER_MONTH + PAYMENT_FEE.fixedUsd;
  return cost / (INPUT_SHARE - PAYMENT_FEE.rate);
}

/** About how many checked drafts an amount of AI spend pays for, if it went only on drafts. */
export function draftsWorth(usd: number): number {
  return Math.floor(usd / actionCost("draft"));
}

export function formatUsd(usd: number): string {
  return Number.isInteger(usd) ? `$${usd}` : `$${usd.toFixed(2)}`;
}
