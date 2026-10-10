import { z } from "zod";

// Structured-output schemas. Keep them free of length/number constraints;
// limits are enforced in code after parsing.

export const ExtractedWinsSchema = z.object({
  wins: z.array(
    z.object({
      summary: z.string().describe("One sentence describing what the user did, in the third person."),
      impact: z.string().describe("Why it mattered (business or people impact). Empty string if not stated."),
      metric: z.string().nullable().describe("The exact figure the user stated, or null. Never invent one."),
      skills: z.array(z.string()).describe("2–4 skills this demonstrates."),
      pillar: z.string().nullable().describe("Name of the best-matching topic pillar, or null."),
      confidential: z.boolean().describe("True if it names clients, internal figures or unannounced plans."),
    }),
  ),
  follow_up_question: z
    .string()
    .nullable()
    .describe("One short question to fill in a missing number or name, or null if nothing important is missing."),
});
export type ExtractedWins = z.infer<typeof ExtractedWinsSchema>;

export const PostIdeasSchema = z.object({
  ideas: z.array(
    z.object({
      angle: z.string().describe("The point of view of the post in one sentence."),
      hook: z.string().describe("A strong first line, under 20 words."),
      pillar: z.string().nullable(),
      source_win_ids: z.array(z.string()).describe("Ids of the wins this idea is based on."),
    }),
  ),
});
export type PostIdeas = z.infer<typeof PostIdeasSchema>;

export const PostDraftSchema = z.object({
  hook: z.string(),
  body: z.string().describe("The full post text including the hook as its first line and the closing question."),
  hashtags: z.array(z.string()).describe("3–5 hashtags without spaces, each starting with #."),
});
export type PostDraft = z.infer<typeof PostDraftSchema>;

export const DraftCheckSchema = z.object({
  grounded: z.boolean().describe("True if every factual claim is supported by the provided facts."),
  unsupported_claims: z.array(z.string()),
  confidentiality_ok: z.boolean(),
  confidentiality_problems: z.array(z.string()),
  job_search_signal: z.boolean(),
  revised_body: z
    .string()
    .nullable()
    .describe("A corrected version of the post if any check failed, otherwise null."),
});
export type DraftCheck = z.infer<typeof DraftCheckSchema>;

export const CommentOptionsSchema = z.object({
  options: z.array(
    z.object({
      approach: z.string().describe("Short label, e.g. 'add an example', 'respectful counterpoint'."),
      text: z.string(),
    }),
  ),
});
export type CommentOptions = z.infer<typeof CommentOptionsSchema>;
