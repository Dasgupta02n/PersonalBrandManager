import type { PostFormat, Tone, WinKind } from "@/lib/domain/types";

/** How each post format is named in the UI. */
export const FORMAT_LABEL: Record<PostFormat, string> = {
  lesson: "A lesson",
  decision: "A decision explained",
  credit: "Credit to the team",
  how_to: "A practical how-to",
};

export const WIN_KIND_LABEL: Record<WinKind, string> = {
  result: "Result",
  decision: "Decision",
  unblocked: "Unblocked",
  helped: "Helped someone",
  praise: "Praise received",
  lesson: "Lesson",
};

/** Quick-start chips on Today: each adds a starter line to the note. */
export const CAPTURE_STARTERS: { label: string; starter: string }[] = [
  { label: "Moved forward", starter: "Moved forward: " },
  { label: "Unblocked", starter: "Unblocked: " },
  { label: "Decided", starter: "Decided: " },
  { label: "Helped someone", starter: "Helped " },
  { label: "Praise I received", starter: "Praise I received: " },
  { label: "Learned", starter: "Learned: " },
];

export const READER_LABEL = {
  peer: "A peer in your field",
  leadership: "Your leadership",
  client_or_recruiter: "A client or recruiter",
} as const;

export const VERDICT_LABEL = {
  confident: "Reads as confident, not boastful",
  boastful: "May read as boastful",
  too_modest: "Undersells your work",
  generic: "Reads as generic",
} as const;

export const TONE_LABEL: Record<Tone, { label: string; hint: string }> = {
  reserved: { label: "Reserved", hint: "Understated. More “we” than “I”." },
  balanced: { label: "Balanced", hint: "Confident and plain." },
  open: { label: "Open", hint: "Warmer and more personal." },
};
