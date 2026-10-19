import { describe, expect, it } from "vitest";
import {
  AI_ALLOWANCE_USD,
  ENGAGED_MONTH,
  INCOME_TAX_RATE,
  INPUT_SHARE,
  PLANNED_ENGAGED_MONTH_USD,
  PRICES,
  SPLIT,
  aiBudget,
  breakdown,
  estimateCallCost,
  monthCost,
  monthlyPriceFloor,
  type BillingOption,
} from "./pricing";

const OPTIONS: BillingOption[] = ["monthly", "annual", "trial"];

describe("price split", () => {
  it("leaves 30% for input once marketing and after-tax profit are set aside", () => {
    expect(INCOME_TAX_RATE).toBeCloseTo(0.25168, 5);
    expect(INPUT_SHARE).toBeCloseTo(0.2991, 4);
    // Input, marketing, pre-tax profit add up to the whole price.
    const preTax = 1 - INPUT_SHARE - SPLIT.marketing;
    expect(preTax * (1 - INCOME_TAX_RATE)).toBeCloseTo(SPLIT.profitAfterTax, 6);
  });

  it.each(OPTIONS)("keeps the split on the %s option, at the full allowance", (option) => {
    const b = breakdown(option);
    expect(b.inputCost / b.revenue).toBeLessThanOrEqual(INPUT_SHARE + 1e-6);
    expect(b.marketing / b.revenue).toBeCloseTo(0.3, 6);
    expect(b.profit / b.revenue).toBeGreaterThanOrEqual(0.3 - 1e-3);
    expect(b.inputCost + b.marketing + b.incomeTax + b.profit).toBeCloseTo(b.revenue, 6);
  });

  it("charges the same price everywhere: one currency, one price per option", () => {
    expect(PRICES.monthly.usd).toBe(29);
    expect(PRICES.annual.usd).toBe(319);
  });
});

describe("trial", () => {
  it("costs 33% of the monthly price", () => {
    expect(Math.round((PRICES.trial.usd / PRICES.monthly.usd) * 100)).toBe(33);
  });

  it("uses 33% of a member's input cost", () => {
    const member = breakdown("monthly", aiBudget("monthly"));
    expect(Math.round((breakdown("trial").inputCost / member.inputCost) * 100)).toBe(33);
  });
});

describe("allowance", () => {
  it("gives members what the tighter of monthly and annual can fund", () => {
    expect(AI_ALLOWANCE_USD.member).toBeLessThanOrEqual(Math.min(aiBudget("monthly"), aiBudget("annual")));
    expect(AI_ALLOWANCE_USD.beta).toBe(AI_ALLOWANCE_USD.member);
    expect(AI_ALLOWANCE_USD.trial).toBeLessThan(AI_ALLOWANCE_USD.member);
  });

  it("covers an engaged member's month on the pinned Opus model", () => {
    expect(monthCost(ENGAGED_MONTH)).toBeLessThanOrEqual(AI_ALLOWANCE_USD.member);
    expect(PRICES.monthly.usd).toBeGreaterThanOrEqual(monthlyPriceFloor());
  });

  it("leaves room for the multi-pass quality pipeline", () => {
    expect(AI_ALLOWANCE_USD.member).toBeGreaterThanOrEqual(PLANNED_ENGAGED_MONTH_USD);
  });

  it("costs calls at OpenRouter list prices, and unknown models as Opus", () => {
    expect(estimateCallCost("anthropic/claude-opus-5.5", { input: 1e6, output: 0 })).toBe(4);
    expect(estimateCallCost("anthropic/claude-opus-5.5", { input: 0, output: 1e6 })).toBe(20);
    expect(estimateCallCost("some/new-model", { input: 1e6, output: 0 })).toBe(4);
  });
});
