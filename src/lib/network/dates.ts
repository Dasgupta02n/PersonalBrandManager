import { addDays } from "@/lib/schedule/time";

const short = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** "Overdue", "Today", "Tomorrow" or "Thu 30 Oct", for a next step. */
export function dueLabel(date: string, today: string): { text: string; overdue: boolean } {
  if (date < today) return { text: `Overdue · ${short(date)}`, overdue: true };
  if (date === today) return { text: "Today", overdue: false };
  if (date === addDays(today, 1)) return { text: "Tomorrow", overdue: false };
  return { text: short(date), overdue: false };
}

/** "12 Oct" or "12 Oct 2025" when it isn't this year. */
export function dayLabel(date: string, today: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: date.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric",
    timeZone: "UTC",
  });
}
