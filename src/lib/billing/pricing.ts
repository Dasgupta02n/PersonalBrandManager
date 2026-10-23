// One global price, in US dollars, the same in every country. Prices exclude sales tax, VAT and
// GST, which the merchant of record adds at checkout where the law requires it.
//
// Every price is split the same way. Payment fees come off first and income tax on the profit is
// set aside; what is left is divided into three equal parts:
//   cost (AI, hosting, database, email, domain)
//   performance marketing
//   profit after income tax
// Cost is a ceiling: each plan's monthly AI allowance is what is left of the cost part after
// platform costs, so a member who uses the whole allowance still leaves the other parts intact.
// Members who use less leave more profit.

export const CURRENCY = "USD";

/** Cost, marketing and profit after tax: three equal parts of what payment fees and tax leave. */
export const EQUAL_PARTS = ["cost", "marketing", "profitAfterTax"] as const;

/**
 * Income tax set aside on profit: a sole proprietor at the top slab of India's new regime, 30%
 * plus 4% cess (surcharge starts above ₹50 lakh of income). A reserve, not advice; deductible
 * costs and marketing are already outside the profit it applies to.
 */
export const INCOME_TAX_RATE = 0.3 * 1.04;

/** Merchant of record (Paddle): 5% plus $0.50 per charge. It collects and files sales tax. */
export const PAYMENT_FEE = { rate: 0.05, fixedUsd: 0.5 } as const;

/**
 * Hosting, database, email and domain per paying user per month: about $60 a month of fixed
 * costs (VPS $10, a larger VPS or database server $25, email $20, domain $1, other $4) shared by
 * 200 paying users, plus about $0.01 of reminder emails each. Below about 200 payers fixed costs
 * take a larger share.
 */
export const PLATFORM_COST_PER_USER_MONTH = 0.31;

/**
 * Each part's share of what is left after payment fees. Profit before tax is part ÷ (1 − tax), so
 * the parts and the tax add up to the whole: part × (2 + 1 ÷ (1 − tax)) = 1.
 */
export const PART_SHARE = 1 / (2 + 1 / (1 - INCOME_TAX_RATE));

export type BillingOption = "monthly" | "annual" | "trial";

// Sized for the multi-pass quality pipeline (several drafts and a grader, specialist checkers),
// which costs about PLANNED_ENGAGED_MONTH_USD a month with caching and overnight batch.
export const PRICES: Record<BillingOption, { usd: number; months: number }> = {
  monthly: { usd: 30, months: 1 },
  // Eleven months' price: one month free.
  annual: { usd: 330, months: 12 },
  // A third of the monthly price for the first 30 days.
  trial: { usd: 10, months: 1 },
};

/**
 * Estimated AI cost of an engaged month once the quality pipeline is built, with the network's
 * suggestions and messages (docs/PRICING.md).
 */
export const PLANNED_ENGAGED_MONTH_USD = 6.65;

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
  /** Platform and AI: the cost part. */
  cost: number;
  marketing: number;
  incomeTax: number;
  profit: number;
}

const perMonth = (option: BillingOption) => PRICES[option].usd / PRICES[option].months;
const feesPerMonth = (option: BillingOption) =>
  (PRICES[option].usd * PAYMENT_FEE.rate + PAYMENT_FEE.fixedUsd) / PRICES[option].months;
const floorCents = (usd: number) => Math.floor(usd * 100 + 1e-9) / 100;

/** One equal part for a billing option, per month: what payment fees and tax leave, divided by three. */
export function part(option: BillingOption): number {
  return PART_SHARE * (perMonth(option) - feesPerMonth(option));
}

/** AI spend a billing option can fund each month while cost stays within its part. */
export function aiBudget(option: BillingOption): number {
  return part(option) - PLATFORM_COST_PER_USER_MONTH;
}

/**
 * Monthly AI allowance per plan, in US dollars of actual model cost. Members get what the
 * annual price can fund (the lower of monthly and annual), so cost stays within its part on
 * every billing option. Beta users get the member allowance.
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
  const cost = platform + ai;
  const marketing = part(option);
  const preTax = revenue - paymentFees - cost - marketing;
  const incomeTax = Math.max(preTax, 0) * INCOME_TAX_RATE;
  return { revenue, paymentFees, platform, ai, cost, marketing, incomeTax, profit: preTax - incomeTax };
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
  verify_wins: [1100, 450],
  post_ideas: [2750, 500],
  draft_post: [2080, 700],
  select_draft: [3300, 600],
  check_draft: [2400, 800],
  how_it_reads: [2250, 600],
  revise_draft: [2400, 450],
  comment_starters: [2650, 500],
  profile_suggestions: [4750, 1500],
  voice_profile: [4500, 500],
  network_map: [2600, 1400],
  outreach_message: [3600, 450],
} as const;

/** Headroom for longer notes, larger records and higher-effort answers. */
const ESTIMATE_SAFETY = 1.5;

const ACTION_CALLS = {
  // The note's wins, fact-checked (QUALITY_STEPS.verifyWins). Post ideas come only on request.
  log: ["extract_wins", "verify_wins"],
  ideas: ["post_ideas"],
  // Three drafts and the editor's pick (QUALITY_STEPS.draftCandidates), then the checks.
  draft: ["draft_post", "draft_post", "draft_post", "select_draft", "check_draft", "how_it_reads"],
  revision: ["revise_draft", "check_draft", "how_it_reads"],
  recheck: ["check_draft", "how_it_reads"],
  commentStarters: ["comment_starters"],
  profileRefresh: ["profile_suggestions"],
  styleRefresh: ["voice_profile"],
  networkMap: ["network_map"],
  outreach: ["outreach_message"],
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
  ideas: 12,
  draft: 10,
  revision: 10,
  recheck: 6,
  commentStarters: 10,
  profileRefresh: 4,
  styleRefresh: 2,
  networkMap: 2,
  outreach: 12,
};

export function monthCost(usage: Partial<Record<Action, number>>): number {
  return Object.entries(usage).reduce((sum, [action, count]) => sum + actionCost(action as Action) * (count ?? 0), 0);
}

/** The lowest monthly price whose cost part covers an engaged month. */
export function monthlyPriceFloor(): number {
  // part = PART_SHARE × (price × (1 − fee rate) − fixed fee) must cover AI and platform.
  const cost = monthCost(ENGAGED_MONTH) + PLATFORM_COST_PER_USER_MONTH;
  return (cost / PART_SHARE + PAYMENT_FEE.fixedUsd) / (1 - PAYMENT_FEE.rate);
}

/** About how many checked drafts an amount of AI spend pays for, if it went only on drafts. */
export function draftsWorth(usd: number): number {
  return Math.floor(usd / actionCost("draft"));
}

export function formatUsd(usd: number): string {
  return Number.isInteger(usd) ? `$${usd}` : `$${usd.toFixed(2)}`;
}
