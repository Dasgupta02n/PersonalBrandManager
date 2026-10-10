import { describe, expect, it } from "vitest";
import {
  addDays,
  dailyStreak,
  isPromptDue,
  isValidTimeZone,
  localParts,
  parseTimeOfDay,
  weekStart,
} from "./time";

describe("localParts", () => {
  it("converts to the user's local date and time", () => {
    // 2026-10-10 13:40 UTC = 19:10 in Kolkata (UTC+5:30)
    expect(localParts(new Date("2026-10-10T13:40:00Z"), "Asia/Kolkata")).toEqual({
      date: "2026-10-10",
      minutes: 19 * 60 + 10,
    });
  });

  it("rolls the date over across midnight", () => {
    // 2026-10-10 20:30 UTC = 00:30 on the 11th in Dubai (UTC+4)
    expect(localParts(new Date("2026-10-10T20:30:00Z"), "Asia/Dubai").date).toBe("2026-10-11");
  });
});

describe("parseTimeOfDay", () => {
  it("parses HH:MM and HH:MM:SS", () => {
    expect(parseTimeOfDay("19:00")).toBe(1140);
    expect(parseTimeOfDay("07:05:00")).toBe(425);
  });

  it("rejects invalid times", () => {
    expect(() => parseTimeOfDay("25:00")).toThrow();
    expect(() => parseTimeOfDay("7pm")).toThrow();
  });
});

describe("isPromptDue", () => {
  const base = { timeZone: "Asia/Kolkata", promptTime: "19:00" };

  it("is due inside the window and not outside it", () => {
    expect(isPromptDue({ ...base, now: new Date("2026-10-10T13:30:00Z") })).toBe(true); // 19:00
    expect(isPromptDue({ ...base, now: new Date("2026-10-10T13:44:00Z") })).toBe(true); // 19:14
    expect(isPromptDue({ ...base, now: new Date("2026-10-10T13:45:00Z") })).toBe(false); // 19:15
    expect(isPromptDue({ ...base, now: new Date("2026-10-10T13:29:00Z") })).toBe(false); // 18:59
  });

  it("handles windows that cross midnight", () => {
    const late = { timeZone: "UTC", promptTime: "23:50" };
    expect(isPromptDue({ ...late, now: new Date("2026-10-10T23:55:00Z") })).toBe(true);
    expect(isPromptDue({ ...late, now: new Date("2026-10-11T00:04:00Z") })).toBe(true);
    expect(isPromptDue({ ...late, now: new Date("2026-10-11T00:05:00Z") })).toBe(false);
  });
});

describe("date helpers", () => {
  it("adds days across month boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("finds the Monday of the week", () => {
    expect(weekStart("2026-10-10")).toBe("2026-10-05"); // Saturday
    expect(weekStart("2026-10-05")).toBe("2026-10-05"); // Monday
    expect(weekStart("2026-10-11")).toBe("2026-10-05"); // Sunday
  });

  it("validates time zones", () => {
    expect(isValidTimeZone("Europe/London")).toBe(true);
    expect(isValidTimeZone("Mars/Base")).toBe(false);
  });
});

describe("dailyStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(dailyStreak(["2026-10-08", "2026-10-09", "2026-10-10"], "2026-10-10")).toBe(3);
  });

  it("keeps yesterday's streak alive before today's entry", () => {
    expect(dailyStreak(["2026-10-08", "2026-10-09"], "2026-10-10")).toBe(2);
  });

  it("resets after a missed day", () => {
    expect(dailyStreak(["2026-10-06", "2026-10-07", "2026-10-09"], "2026-10-10")).toBe(1);
    expect(dailyStreak(["2026-10-07"], "2026-10-10")).toBe(0);
  });
});
