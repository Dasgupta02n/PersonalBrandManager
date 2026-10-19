import type { PostFormat } from "@/lib/domain/types";

// The private style notebook: how one user writes. Learned from the edits they make before
// posting (plain code, below) and from their sample posts and recent posts (the voice_profile AI
// step). Lives in their own account, is used only for their drafts, and is never used to train
// AI models. The user can see, add to, remove from and clear it.

export type NoteSource = "learned" | "edits" | "you";

export interface Note {
  key: string;
  text: string;
  source: NoteSource;
}

export interface EditStats {
  /** Edited posts analysed so far, and since the AI last refreshed the notebook. */
  pairs: number;
  pairsSinceRefresh: number;
  /** Words the user deleted from AI drafts: in how many drafts each was removed or added back. */
  removed: Record<string, number>;
  added: Record<string, number>;
  /** Drafts where the user moved from "I" towards "we". */
  towardsWe: number;
  emojiRemoved: number;
  hashtagsRemoved: number;
  exclamationsRemoved: number;
  shortened: number;
  lengthened: number;
  /** Post ideas dismissed, by format; one-tap revisions used, by mode. */
  formatsSkipped: Partial<Record<PostFormat, number>>;
  revisions: Record<string, number>;
}

export const EMPTY_STATS: EditStats = {
  pairs: 0,
  pairsSinceRefresh: 0,
  removed: {},
  added: {},
  towardsWe: 0,
  emojiRemoved: 0,
  hashtagsRemoved: 0,
  exclamationsRemoved: 0,
  shortened: 0,
  lengthened: 0,
  formatsSkipped: {},
  revisions: {},
};

export function readStats(raw: unknown): EditStats {
  return { ...EMPTY_STATS, ...(raw && typeof raw === "object" ? (raw as Partial<EditStats>) : {}) };
}

/** Common words never worth learning as "words you avoid". */
const STOPWORDS = new Set(
  (
    "about after again also because been before being between both could does doing down during each " +
    "from further have having here into just more most much once only other over same should some such " +
    "than that their them then there these they this those through very what when where which while " +
    "will with would your yours ours we our us i me my it its the and but for not are was were has had " +
    "can you all any few how who why off out own too did his her him she"
  ).split(" "),
);

const WORD = /[\p{L}][\p{L}'’-]*/gu;
const EMOJI = /\p{Extended_Pictographic}/gu;

function words(text: string): string[] {
  return (text.match(WORD) ?? []).map((w) => w.toLowerCase().replace(/[’]/g, "'"));
}

const count = (text: string, pattern: RegExp) => text.match(pattern)?.length ?? 0;
const pronouns = (text: string) => ({
  i: count(text, /\b(?:I|I'm|I've|my|me)\b/g),
  we: count(text, /\b(?:we|we're|we've|our|us)\b/gi),
});

/** What one edit teaches: the AI's version against what the user actually posted. */
export function learnFromEdit(stats: EditStats, aiText: string, posted: string): EditStats {
  if (!aiText.trim() || aiText.trim() === posted.trim()) return stats;
  const before = new Set(words(aiText));
  const after = new Set(words(posted));
  const next: EditStats = {
    ...stats,
    removed: { ...stats.removed },
    added: { ...stats.added },
    pairs: stats.pairs + 1,
    pairsSinceRefresh: stats.pairsSinceRefresh + 1,
  };

  const learnable = (w: string) => w.length >= 4 && !STOPWORDS.has(w);
  for (const w of before) if (!after.has(w) && learnable(w)) next.removed[w] = (next.removed[w] ?? 0) + 1;
  for (const w of after) if (!before.has(w) && learnable(w)) next.added[w] = (next.added[w] ?? 0) + 1;

  const p0 = pronouns(aiText);
  const p1 = pronouns(posted);
  if (p1.i < p0.i && p1.we >= p0.we) next.towardsWe += 1;
  if (count(posted, EMOJI) < count(aiText, EMOJI)) next.emojiRemoved += 1;
  if (count(posted, /#[\p{L}\p{N}_]+/gu) < count(aiText, /#[\p{L}\p{N}_]+/gu)) next.hashtagsRemoved += 1;
  if (count(posted, /!/g) < count(aiText, /!/g)) next.exclamationsRemoved += 1;

  const ratio = words(posted).length / Math.max(words(aiText).length, 1);
  if (ratio < 0.85) next.shortened += 1;
  if (ratio > 1.15) next.lengthened += 1;
  return next;
}

export function learnFromSkippedIdea(stats: EditStats, format: PostFormat): EditStats {
  return { ...stats, formatsSkipped: { ...stats.formatsSkipped, [format]: (stats.formatsSkipped[format] ?? 0) + 1 } };
}

export function learnFromRevision(stats: EditStats, mode: string): EditStats {
  return { ...stats, revisions: { ...stats.revisions, [mode]: (stats.revisions[mode] ?? 0) + 1 } };
}

/** A pattern counts once it shows up in this many separate drafts. */
const SEEN = 2;

/** Words removed from at least two drafts and never added back, most often first. */
export function avoidedWords(stats: EditStats, muted: string[] = []): string[] {
  const off = new Set(muted);
  return Object.entries(stats.removed)
    .filter(([w, n]) => n >= SEEN && !(stats.added[w] > 0) && !off.has(`avoid:${w}`))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([w]) => w);
}

/** Formats the user dismisses repeatedly. */
export function skippedFormats(stats: EditStats): PostFormat[] {
  return (Object.entries(stats.formatsSkipped) as [PostFormat, number][]).filter(([, n]) => n >= 3).map(([f]) => f);
}

const FORMAT_WORDS: Record<PostFormat, string> = {
  lesson: "lesson",
  decision: "decision",
  credit: "credit-to-the-team",
  how_to: "how-to",
};

/** Notebook lines that follow from the counts alone. Recomputed every time, so they stay current. */
export function notesFromEdits(stats: EditStats, muted: string[] = []): Note[] {
  const notes: Note[] = [];
  const add = (key: string, when: boolean, text: string) => when && notes.push({ key, text, source: "edits" });
  add("edits:we", stats.towardsWe >= SEEN, "Says “we” rather than “I” for team results");
  add("edits:emoji", stats.emojiRemoved >= SEEN, "No emojis");
  add("edits:hashtags", stats.hashtagsRemoved >= SEEN, "Few or no hashtags");
  add("edits:exclamations", stats.exclamationsRemoved >= SEEN, "No exclamation marks");
  add("edits:shorter", stats.shortened >= 3 && stats.shortened > 2 * stats.lengthened, "Keeps posts shorter than the first draft");
  add("edits:modest", (stats.revisions.humbler ?? 0) >= SEEN, "Prefers a more modest tone");
  add("edits:short", (stats.revisions.shorter ?? 0) >= SEEN, "Likes posts short");
  add("edits:opening", (stats.revisions.stronger_opening ?? 0) >= SEEN, "Wants a sharper first line");
  for (const format of skippedFormats(stats)) add(`edits:skips-${format}`, true, `Rarely picks ${FORMAT_WORDS[format]} posts`);
  const off = new Set(muted);
  return notes.filter((n) => !off.has(n.key));
}

export interface Notebook {
  summary: string;
  notes: Note[];
  avoidWords: string[];
  skippedFormats: PostFormat[];
}

/** The notebook as the user sees it and the AI follows it. */
export function buildNotebook(row: { summary?: string | null; notes?: unknown; muted?: string[] | null; edit_stats?: unknown } | null): Notebook {
  const stats = readStats(row?.edit_stats);
  const muted = row?.muted ?? [];
  const stored = Array.isArray(row?.notes) ? (row.notes as Note[]).filter((n) => n && typeof n.text === "string" && n.text.trim()) : [];
  const off = new Set(muted);
  return {
    summary: row?.summary ?? "",
    notes: [...stored.filter((n) => !off.has(n.key)), ...notesFromEdits(stats, muted)],
    avoidWords: avoidedWords(stats, muted),
    skippedFormats: skippedFormats(stats).filter((f) => !off.has(`edits:skips-${f}`)),
  };
}
