/** Phrases that signal a job search. Drafts must never contain them. */
export const JOB_SEARCH_PHRASES = [
  "open to work",
  "#opentowork",
  "open to new opportunities",
  "open to opportunities",
  "open to new roles",
  "open to new challenges",
  "excited for what's next",
  "excited about what's next",
  "looking for my next",
  "my next chapter",
  "next chapter of my career",
  "my next adventure",
  "exploring new opportunities",
  "seeking new opportunities",
  "seeking a new role",
  "actively looking",
  "on the job market",
  "between roles",
  "available for new roles",
  "available immediately",
  "hire me",
] as const;

/** Overused LinkedIn clichés that make a post sound generic. */
export const CLICHE_PHRASES = [
  "thrilled to announce",
  "excited to announce",
  "thrilled to share",
  "game-changer",
  "game changer",
  "think outside the box",
  "move the needle",
  "low-hanging fruit",
  "paradigm shift",
  "synergies",
] as const;

/** Humility used as cover for a brag. Research shows it lowers both liking and credibility. */
export const HUMBLEBRAG_PHRASES = [
  "humbled to announce",
  "humbled to share",
  "i'm humbled",
  "i am humbled",
  "humbled and honored",
  "humbled and honoured",
  "blessed to announce",
  "can't believe i was chosen",
  "who would have thought",
  "so exhausted after my keynote",
] as const;

/** Phrases readers associate with AI-written posts. */
export const AI_TELL_PHRASES = [
  "in today's fast-paced world",
  "fast-paced world",
  "ever-evolving landscape",
  "unlock the power",
  "delve into",
  "a testament to",
  "let that sink in",
  "here's the thing",
  "buckle up",
  "navigate the complexities",
] as const;

/**
 * Promissory and performance language that regulated firms (FINRA 2210, FCA financial
 * promotions, SEBI) treat as a breach in a public post. Checked only in regulated-firm mode.
 */
export const REGULATED_PHRASES = [
  "guaranteed return",
  "guaranteed returns",
  "guaranteed income",
  "guaranteed growth",
  "assured return",
  "assured returns",
  "risk-free",
  "risk free",
  "zero risk",
  "no risk",
  "can't lose",
  "cannot lose",
  "will outperform",
  "beat the market",
  "beats the market",
  "double your money",
  "best investment",
  "safe investment",
  "sure-shot",
  "multibagger",
  "target price",
  "strong buy",
  "stock tip",
  "invest now",
] as const;

/** Words that suggest information that isn't public yet. A note to check, never a block. */
export const SENSITIVE_PHRASES = [
  "confidential",
  "internal only",
  "not yet public",
  "not public yet",
  "not yet announced",
  "unannounced",
  "under nda",
  "nda",
  "embargo",
  "embargoed",
  "off the record",
  "between us",
  "leaked",
  "acquisition talks",
  "merger talks",
  "in talks to acquire",
  "layoffs",
  "before it's announced",
  "ahead of the announcement",
] as const;
