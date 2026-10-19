// Win rates and rates with 95% confidence intervals (Wilson), so small samples aren't over-read.

export interface Interval {
  k: number;
  n: number;
  p: number;
  low: number;
  high: number;
}

export function wilson(k: number, n: number, z = 1.96): Interval {
  if (n === 0) return { k, n, p: 0, low: 0, high: 0 };
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return { k, n, p, low: Math.max(0, centre - half), high: Math.min(1, centre + half) };
}

export interface WinRate extends Interval {
  wins: number;
  losses: number;
  ties: number;
}

/** Product against baseline: a win counts 1, a tie half. */
export function winRate(results: ("win" | "loss" | "tie")[]): WinRate {
  const wins = results.filter((r) => r === "win").length;
  const losses = results.filter((r) => r === "loss").length;
  const ties = results.length - wins - losses;
  return { ...wilson(wins + ties / 2, results.length), wins, losses, ties };
}

/** The ship gate for writing functions: a 60% win rate, with the interval clear of a coin flip. */
export function beatsBaseline(rate: WinRate): boolean {
  return rate.n > 0 && rate.p >= 0.6 && rate.low > 0.5;
}

export const pct = (x: number) => `${Math.round(x * 100)}%`;
export const ci = (r: Interval) => `${pct(r.p)} (${pct(r.low)}–${pct(r.high)}, n=${r.n})`;
