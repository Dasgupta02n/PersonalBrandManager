import { describe, expect, it } from "vitest";
import {
  AI_ALLOWANCE_USD,
  ENGAGED_MONTH,
  INCOME_TAX_RATE,
  PART_SHARE,
  PLANNED_ENGAGED_MONTH_USD,
  PRICES,
  aiBudget,
  breakdown,
  estimateCallCost,
  monthCost,
  monthlyPriceFloor,
  part,
  type BillingOption,
} from "./pricing";

const OPTIONS: BillingOption[] = ["monthly", "annual", "trial"];

describe("price split", () => {
  it("divides what fees and tax leave into three equal parts", () => {
    expect(INCOME_TAX_RATE).toBeCloseTo(0.312, 6);
    // Cost, marketing and profit after tax are one part each; profit before tax carries the tax.
    expect(PART_SHARE * 2 + PART_SHARE / (1 - INCOME_TAX_RATE)).toBeCloseTo(1, 9);
  });

  it.each(OPTIONS)("keeps the split on the %s option, at the full allowance", (option) => {
    const b = breakdown(option);
    const afterFees = b.revenue - b.paymentFees;
    expect(b.cost).toBeLessThanOrEqual(part(option) + 1e-6);
    expect(b.marketing / afterFees).toBeCloseTo(PART_SHARE, 6);
    expect(b.profit).toBeGreaterThanOrEqual(part(option) - 1e-6);
    expect(b.paymentFees + b.cost + b.marketing + b.incomeTax + b.profit).toBeCloseTo(b.revenue, 6);
  });

  it("charges the same price everywhere: one currency, one price per option", () => {
    expect(PRICES.monthly.usd).toBe(30);
    expect(PRICES.annual.usd).toBe(330);
    expect(PRICES.trial.usd).toBe(10);
  });
});

describe("trial", () => {
  it("costs a third of the monthly price", () => {
    expect(PRICES.trial.usd * 3).toBe(PRICES.monthly.usd);
  });

  it("funds less AI than a member's month", () => {
    expect(aiBudget("trial")).toBeLessThan(aiBudget("monthly"));
  });
});

describe("allowance", () => {
  it("gives members what the tighter of monthly and annual can fund", () => {
    expect(AI_ALLOWANCE_USD.member).toBeLessThanOrEqual(Math.min(aiBudget("monthly"), aiBudget("annual")));
    expect(AI_ALLOWANCE_USD.beta).toBe(AI_ALLOWANCE_USD.member);
    expect(AI_ALLOWANCE_USD.trial).toBeLessThan(AI_ALLOWANCE_USD.member);
  });

  it("covers an engaged member's month, network included, on the pinned Opus model", () => {
    expect(ENGAGED_MONTH.networkMap).toBeGreaterThan(0);
    expect(ENGAGED_MONTH.outreach).toBeGreaterThan(0);
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
