import { z } from "zod";
import { POST_FORMATS, WIN_KINDS } from "@/lib/domain/types";

// Test sets for the quality bar. Every case is synthetic: written for evaluation, with fictional
// people, employers and clients. No user data ever goes into these files.

const id = z.string().regex(/^[a-z]+-\d{3}$/, "ids look like note-001");
const personaId = z.string().regex(/^p\d{2}$/);
const date = z.iso.date();

export const RulesSchema = z.object({
  employerName: z.string().nullable(),
  employerPolicy: z.enum(["name", "generic", "never"]),
  neverMention: z.array(z.string().min(1)),
  numberPolicy: z.enum(["exact", "rounded", "relative"]),
  noGoTopics: z.array(z.string().min(1)),
  regulated: z.boolean(),
  maskNames: z.boolean(),
});

export const PersonaSchema = z.object({
  id: personaId,
  name: z.string(),
  headline: z.string(),
  industry: z.string(),
  market: z.string(),
  tone: z.enum(["reserved", "balanced", "open"]),
  pillars: z.array(z.string()).min(2).max(4),
  targetRoles: z.array(z.string()),
  targetIndustries: z.array(z.string()),
  rules: RulesSchema,
  /** Posts this person wrote, in their own voice. */
  samplePosts: z.array(z.string().min(200)).min(2).max(3),
  /** What their style notebook would say. */
  styleNotes: z.array(z.string()).max(6),
});

export const WinSchema = z.object({
  id: z.string().regex(/^w\d{3,4}$/),
  occurredOn: date,
  summary: z.string().min(10),
  impact: z.string(),
  metric: z.string().nullable(),
  kind: z.enum(WIN_KINDS),
  confidential: z.boolean(),
  pillar: z.string().nullable(),
});

/** extract_wins: a daily note and what a good extraction must get right. */
export const NoteCaseSchema = z.object({
  id,
  personaId,
  date,
  text: z.string().min(15).max(1500),
  expect: z.object({
    minWins: z.number().int().min(0),
    maxWins: z.number().int().min(0),
    /** Figures the note states; any other metric in the output is invented. */
    metrics: z.array(z.string()),
    /** True if at least one win should be flagged confidential. */
    confidential: z.boolean(),
    /** Third-party people and client names in the note, which masking must keep out. */
    names: z.array(z.string()),
    /** True if the user's own part or a key number is missing, so a follow-up question helps. */
    followUpHelps: z.boolean(),
  }),
});

/** post_ideas: a recent record to suggest posts from. */
export const IdeaCaseSchema = z.object({ id, personaId, wins: z.array(WinSchema).min(4).max(15) });

/** draft_post: one idea and the wins behind it. */
export const DraftCaseSchema = z.object({
  id,
  personaId,
  format: z.enum(POST_FORMATS),
  angle: z.string().min(10),
  hook: z.string().min(5),
  wins: z.array(WinSchema).min(1).max(4),
});

export const RISK_CATEGORIES = [
  "confidential_client",
  "internal_figure",
  "unannounced",
  "job_search",
  "no_go_topic",
  "hierarchy",
  "regulated_promissory",
  "unsupported_claim",
] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

/** check_draft: a post with its known risks (empty for a clean post) and the record it should match. */
export const RiskCaseSchema = z.object({
  id,
  personaId,
  post: z.string().min(150),
  risks: z.array(z.enum(RISK_CATEGORIES)),
  /** For people reviewing results: what exactly is risky. */
  explanation: z.string(),
  facts: z.array(WinSchema).min(1).max(5),
});

/** how_it_reads: a post written to read a known way. */
export const ReadCaseSchema = z.object({
  id,
  personaId,
  post: z.string().min(150),
  expected: z.enum(["confident", "boastful", "too_modest", "generic"]),
  why: z.string(),
});

/** revise_draft: a post, the revision asked for, and its facts. */
export const RevisionCaseSchema = z.object({
  id,
  personaId,
  post: z.string().min(150),
  mode: z.enum(["shorter", "humbler", "stronger_opening"]),
  facts: z.array(WinSchema).min(1).max(4),
});

/** comment_starters: someone else's post the persona wants to respond to. */
export const CommentCaseSchema = z.object({
  id,
  personaId,
  authorRole: z.string(),
  post: z.string().min(150).max(3000),
});

/** profile_suggestions: a year of wins and the profile the person has today. */
export const ProfileCaseSchema = z.object({
  id,
  personaId,
  wins: z.array(WinSchema).min(10).max(40),
  current: z.object({ headline: z.string(), about: z.string(), experience: z.string() }),
});

/** voice_profile: edits the person made, and the style traits a good notebook should capture. */
export const VoiceCaseSchema = z.object({
  id,
  personaId,
  pairs: z.array(z.object({ drafted: z.string().min(150), posted: z.string().min(100) })).min(2).max(5),
  expectedTraits: z.array(z.string()).min(3).max(8),
});

export type Persona = z.infer<typeof PersonaSchema>;
export type EvalWin = z.infer<typeof WinSchema>;
export type NoteCase = z.infer<typeof NoteCaseSchema>;
export type IdeaCase = z.infer<typeof IdeaCaseSchema>;
export type DraftCase = z.infer<typeof DraftCaseSchema>;
export type RiskCase = z.infer<typeof RiskCaseSchema>;
export type ReadCase = z.infer<typeof ReadCaseSchema>;
export type RevisionCase = z.infer<typeof RevisionCaseSchema>;
export type CommentCase = z.infer<typeof CommentCaseSchema>;
export type ProfileCase = z.infer<typeof ProfileCaseSchema>;
export type VoiceCase = z.infer<typeof VoiceCaseSchema>;

/** Each test set: file, schema, and the size step 1 commits to. */
export const DATASETS = {
  personas: { file: "personas.json", schema: PersonaSchema, size: 12 },
  notes: { file: "notes.json", schema: NoteCaseSchema, size: 200 },
  ideas: { file: "ideas.json", schema: IdeaCaseSchema, size: 60 },
  drafts: { file: "drafts.json", schema: DraftCaseSchema, size: 300 },
  risks: { file: "risks.json", schema: RiskCaseSchema, size: 140 },
  reads: { file: "reads.json", schema: ReadCaseSchema, size: 60 },
  revisions: { file: "revisions.json", schema: RevisionCaseSchema, size: 60 },
  comments: { file: "comments.json", schema: CommentCaseSchema, size: 60 },
  profiles: { file: "profiles.json", schema: ProfileCaseSchema, size: 24 },
  voices: { file: "voices.json", schema: VoiceCaseSchema, size: 24 },
} as const;
export type DatasetName = keyof typeof DATASETS;
