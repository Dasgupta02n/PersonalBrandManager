/** Date and time helpers that work in a user's own time zone. Dates are `YYYY-MM-DD` strings. */

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export interface LocalParts {
  date: string;
  minutes: number;
}

/** The user's local calendar date and minutes since local midnight at `now`. */
export function localParts(now: Date, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** Parses `HH:MM` or `HH:MM:SS` into minutes since midnight. */
export function parseTimeOfDay(value: string): number {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) throw new Error(`Invalid time of day: ${value}`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error(`Invalid time of day: ${value}`);
  return hours * 60 + minutes;
}

const MINUTES_PER_DAY = 24 * 60;

/**
 * True when the user's local time is inside [promptTime, promptTime + windowMinutes).
 * The scheduler runs every `windowMinutes`, so each prompt fires exactly once per day.
 */
export function isPromptDue(params: {
  now: Date;
  timeZone: string;
  promptTime: string;
  windowMinutes?: number;
}): boolean {
  const window = params.windowMinutes ?? 15;
  const start = parseTimeOfDay(params.promptTime);
  const { minutes } = localParts(params.now, params.timeZone);
  const end = start + window;
  if (end <= MINUTES_PER_DAY) return minutes >= start && minutes < end;
  return minutes >= start || minutes < end - MINUTES_PER_DAY;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `date`. */
export function weekStart(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7;
  return addDays(date, -offset);
}

/**
 * Consecutive days with at least one entry, ending today. If today has no entry yet,
 * the streak still counts up to yesterday so it is not lost before the evening prompt.
 */
export function dailyStreak(entryDates: Iterable<string>, today: string): number {
  const days = new Set(entryDates);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
