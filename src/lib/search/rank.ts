// Ranking wins against a query: by meaning (embeddings from our own model) when available, and
// by shared words always, so search still works if the model is unavailable. Pure functions.

export interface RankableWin {
  id: string;
  summary: string;
  impact: string;
  skills: string[];
  embedding?: number[] | null;
}

/** The text a win is searched and embedded by. */
export function winText(win: Pick<RankableWin, "summary" | "impact" | "skills">): string {
  return [win.summary, win.impact, win.skills.length ? `Skills: ${win.skills.join(", ")}` : ""].filter(Boolean).join(" ");
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

const STOP = new Set(
  "the and for with that this from what when where who how was were are have has had about into over after before our your their they them his her its can could would should will just than then also very more most less some any all not but".split(
    " ",
  ),
);

/** A rough stem: "costs", "costing" and "costed" all become "cost". */
const stem = (word: string) => word.replace(/(?:ings|ing|ies|es|ed|s)$/, "").slice(0, 6) || word.slice(0, 6);

/** Lowercase word stems of three letters or more, without common words. */
export function terms(text: string): string[] {
  return [...new Set((text.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []).filter((w) => !STOP.has(w)).map(stem))];
}

/** Share of the query's terms found in the text. */
export function keywordScore(query: string[], text: string): number {
  if (!query.length) return 0;
  const have = new Set(terms(text));
  return query.filter((t) => have.has(t)).length / query.length;
}

export interface Ranked<T> {
  win: T;
  score: number;
}

/**
 * Wins best matching a query, best first. With a query vector, meaning counts most and shared
 * words break ties; without one, shared words alone. Small embedding models score everything in
 * a narrow band, so a match by meaning must stand out from the user's other wins (above their
 * median by a margin), not pass a fixed bar. Weak matches are dropped.
 */
export function rankWins<T extends RankableWin>(query: string, queryVector: number[] | null, wins: T[], limit = 10): Ranked<T>[] {
  const q = terms(query);
  const scored = wins.map((win) => ({
    win,
    words: keywordScore(q, winText(win)),
    meaning: queryVector && win.embedding?.length ? cosine(queryVector, win.embedding) : null,
  }));
  const meanings = scored.map((s) => s.meaning).filter((m): m is number => m !== null).sort((a, b) => a - b);
  const bar = meanings.length >= 5 ? meanings[Math.floor(meanings.length / 2)] + MEANING_MARGIN : MEANING_FLOOR;
  return scored
    .map(({ win, words, meaning }) => ({
      win,
      score: meaning === null ? words : 0.8 * meaning + 0.2 * words,
      strong: words >= 0.5 || (meaning === null ? words >= 0.34 : meaning >= bar),
    }))
    .filter((r) => r.strong)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ win, score }) => ({ win, score }));
}

/** Calibrated on bge-small: related wins score about 0.57 at the median, unrelated about 0.46. */
const MEANING_MARGIN = 0.06;
const MEANING_FLOOR = 0.5;
