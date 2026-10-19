import { describe, expect, it } from "vitest";
import { allowancePeriod, allowanceStatus, exhaustedMessage, isExhausted } from "./allowance-period";
import { AI_ALLOWANCE_USD } from "./pricing";

const now = new Date("2026-10-19T10:00:00Z");

describe("allowancePeriod", () => {
  it("gives members and beta users a calendar month", () => {
    const { start, end } = allowancePeriod("member", new Date("2026-01-05T00:00:00Z"), now);
    expect(start.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });

  it("gives a trial its first 30 days, once", () => {
    const { start, end } = allowancePeriod("trial", new Date("2026-10-10T08:00:00Z"), now);
    expect(start.toISOString()).toBe("2026-10-10T08:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-09T08:00:00.000Z");
  });
});

describe("allowanceStatus", () => {
  it("is not exhausted below the plan's allowance", () => {
    const status = allowanceStatus("member", now, AI_ALLOWANCE_USD.member / 2, now);
    expect(status.used).toBeCloseTo(0.5);
    expect(isExhausted(status)).toBe(false);
  });

  it("is exhausted at the allowance", () => {
    expect(isExhausted(allowanceStatus("member", now, AI_ALLOWANCE_USD.member, now))).toBe(true);
  });

  it("ends a trial after 30 days whatever was spent", () => {
    const status = allowanceStatus("trial", new Date("2026-09-01T00:00:00Z"), 0, now);
    expect(status.ended).toBe(true);
    expect(isExhausted(status)).toBe(true);
    expect(exhaustedMessage(status)).toMatch(/trial month has ended/);
  });

  it("tells members when the allowance renews, and that notes are kept", () => {
    const message = exhaustedMessage(allowanceStatus("member", now, 99, now));
    expect(message).toMatch(/notes are still saved/);
    expect(message).toMatch(/1 November/);
  });
});
