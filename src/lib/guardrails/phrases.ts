/** Phrases that signal a job search. Drafts must never contain them. */
export const JOB_SEARCH_PHRASES = [
  "open to work",
  "#opentowork",
  "open to new opportunities",
  "open to opportunities",
  "open to new roles",
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
