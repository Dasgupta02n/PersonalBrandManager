export type EmployerPolicy = "name" | "generic" | "never";
export type NumberPolicy = "exact" | "rounded" | "relative";
export type DraftKind = "post_idea" | "post" | "comment" | "reply";
export type DraftStatus = "idea" | "draft" | "ready" | "posted" | "discarded";

export interface ConfidentialityRules {
  employerName: string | null;
  employerPolicy: EmployerPolicy;
  neverMention: string[];
  numberPolicy: NumberPolicy;
}

export interface Pillar {
  id: string;
  name: string;
  description: string;
}

export interface VoiceProfile {
  summary: string;
  samplePosts: string[];
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
}

export interface UserContext {
  fullName: string | null;
  headline: string | null;
  targetIndustries: string[];
  targetRoles: string[];
  pillars: Pillar[];
  voice: VoiceProfile;
  rules: ConfidentialityRules;
}

export const DEFAULT_RULES: ConfidentialityRules = {
  employerName: null,
  employerPolicy: "generic",
  neverMention: [],
  numberPolicy: "rounded",
};
