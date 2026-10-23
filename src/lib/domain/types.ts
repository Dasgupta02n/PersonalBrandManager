export type EmployerPolicy = "name" | "generic" | "never";
export type NumberPolicy = "exact" | "rounded" | "relative";
export type DraftKind = "post_idea" | "post" | "comment" | "reply";
export type DraftStatus = "idea" | "draft" | "ready" | "posted" | "discarded";
export type Tone = "reserved" | "balanced" | "open";
export type PromptChannel = "web_push" | "email" | "whatsapp";

export const WIN_KINDS = ["result", "decision", "unblocked", "helped", "praise", "lesson"] as const;
export type WinKind = (typeof WIN_KINDS)[number];

export const POST_FORMATS = ["lesson", "decision", "credit", "how_to"] as const;
export type PostFormat = (typeof POST_FORMATS)[number];

export interface ConfidentialityRules {
  employerName: string | null;
  employerPolicy: EmployerPolicy;
  neverMention: string[];
  numberPolicy: NumberPolicy;
  /** Themes the user never wants to post about. Checked by the AI on every draft. */
  noGoTopics: string[];
  /** Works at a regulated firm: promissory and performance language is stopped. */
  regulated: boolean;
  /** Keep other people's names out of stored notes and wins. */
  maskNames: boolean;
}

export interface Pillar {
  id: string;
  name: string;
  description: string;
}

export interface VoiceProfile {
  summary: string;
  samplePosts: string[];
  /** The private style notebook: how this user writes, learned from samples and edits. */
  notes: string[];
  /** Words the user keeps removing from drafts. */
  avoidWords: string[];
  /** Post formats the user keeps dismissing. */
  skippedFormats: PostFormat[];
}

export interface Win {
  id: string;
  occurredOn: string;
  summary: string;
  impact: string;
  metric: string | null;
  skills: string[];
  pillarId: string | null;
  confidential: boolean;
  kind: WinKind;
}

export interface UserContext {
  fullName: string | null;
  headline: string | null;
  targetIndustries: string[];
  targetRoles: string[];
  tone: Tone;
  pillars: Pillar[];
  voice: VoiceProfile;
  rules: ConfidentialityRules;
  /** Names of the people in the user's network: always kept away from the AI model. */
  knownPeople?: string[];
}

export const DEFAULT_RULES: ConfidentialityRules = {
  employerName: null,
  employerPolicy: "generic",
  neverMention: [],
  numberPolicy: "rounded",
  noGoTopics: [],
  regulated: false,
  maskNames: true,
};
