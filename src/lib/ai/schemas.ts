import { z } from "zod";
import { POST_FORMATS, WIN_KINDS } from "@/lib/domain/types";

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
      kind: z
        .enum(WIN_KINDS)
        .describe(
          "result: an outcome achieved; decision: a call the user made; unblocked: a problem the user removed; " +
            "helped: someone the user developed or supported; praise: recognition the user received from others; " +
            "lesson: something the user learned.",
        ),
    }),
  ),
  follow_up_question: z
    .string()
    .nullable()
    .describe("One short question about the user's own part or a number they can share, or null if nothing important is missing."),
  masked_note: z
    .string()
    .nullable()
    .describe(
      "Only when asked to keep names out: the user's whole note, unchanged except that other people's names are replaced " +
        "by their role and never-mention terms by a generic description. Otherwise null.",
    ),
});
export type ExtractedWins = z.infer<typeof ExtractedWinsSchema>;

export const PostIdeasSchema = z.object({
  ideas: z
    .array(
      z.object({
        format: z
          .enum(POST_FORMATS)
          .describe(
            "lesson: what the user learned; decision: what they chose, the trade-off and what they learned; " +
              "credit: the result and who made it possible; how_to: a practical method from the work.",
          ),
        angle: z.string().describe("The point of the post in one sentence."),
        hook: z.string().describe("A plain, specific first line, under 20 words."),
        pillar: z.string().nullable(),
        source_win_ids: z.array(z.string()).describe("Ids of the wins this idea is based on."),
      }),
    )
    .describe("Best idea first."),
});
export type PostIdeas = z.infer<typeof PostIdeasSchema>;

export const VerifiedWinsSchema = z.object({
  wins: z
    .array(z.object({ summary: z.string(), impact: z.string() }))
    .describe("Every win, in the order given, with only what the note supports."),
});

export const VerifiedIdeasSchema = z.object({
  ideas: z
    .array(z.object({ angle: z.string(), hook: z.string() }))
    .describe("Every idea, in the order given, with only what its wins support."),
});

export const DraftChoiceSchema = z.object({
  best: z.number().int().describe("The number of the draft to show the user."),
  reason: z.string().describe("One sentence on why."),
});

export const PostDraftSchema = z.object({
  hook: z.string(),
  body: z.string().describe("The full post text including the hook as its first line and the closing question."),
  hashtags: z.array(z.string()).describe("0–3 hashtags without spaces, each starting with #. Empty if none fit."),
});
export type PostDraft = z.infer<typeof PostDraftSchema>;

export const DraftCheckSchema = z.object({
  grounded: z.boolean().describe("True if every factual claim is supported by the provided facts."),
  unsupported_claims: z.array(z.string()),
  confidentiality_ok: z.boolean(),
  confidentiality_problems: z.array(z.string()),
  job_search_signal: z.boolean(),
  no_go_topic_hits: z.array(z.string()).describe("No-go topics the draft touches, in the user's words; empty if none."),
  hierarchy_risk: z
    .string()
    .nullable()
    .describe(
      "If the post could embarrass the user's manager, leadership, colleagues or a client (taking sole credit, " +
        "implying others failed, revealing internal disagreement), one sentence saying why; otherwise null.",
    ),
  revised_body: z
    .string()
    .nullable()
    .describe("A corrected version of the post if any check failed, otherwise null."),
});
export type DraftCheck = z.infer<typeof DraftCheckSchema>;

export const HowItReadsSchema = z.object({
  verdict: z
    .enum(["confident", "boastful", "too_modest", "generic"])
    .describe("How the post comes across overall to people who know the author professionally."),
  sounds_like_user: z
    .boolean()
    .nullable()
    .describe("Whether it sounds like the user's sample posts; null when there are no samples."),
  readers: z.array(
    z.object({
      reader: z.enum(["peer", "leadership", "client_or_recruiter"]),
      reads_as: z.string().describe("How this reader would likely take the post, in under 12 words."),
      concern: z.string().nullable().describe("A specific risk with this reader, or null."),
    }),
  ),
  lines: z
    .array(
      z.object({
        quote: z.string().describe("Exact text from the draft."),
        issue: z.enum(["boastful", "humblebrag", "sounds_ai", "unclear", "takes_sole_credit"]),
        suggestion: z.string().describe("Replacement text for the quote, keeping the facts."),
      }),
    )
    .describe("At most 4 lines worth changing; empty if none."),
});
export type HowItReadsOutput = z.infer<typeof HowItReadsSchema>;

export const RevisionSchema = z.object({
  body: z.string().describe("The full revised post."),
});

const section = (text: string) =>
  z.object({
    text: z.string().describe(text),
    reason: z.string().describe("One sentence: why this, and which wins it draws on."),
  });
const bullets = (text: string) =>
  z.object({
    bullets: z.array(z.string()).describe(text),
    reason: z.string().describe("One sentence: why these, and which wins they draw on."),
  });

export const ProfileSuggestionsSchema = z.object({
  headline: section("The LinkedIn headline, under 220 characters."),
  about: section("The LinkedIn About section, first person, 120–250 words."),
  experience: bullets("3–5 bullets for the current role on LinkedIn."),
  cv: bullets("3–6 achievement bullets for the CV."),
  skills: z.object({
    items: z.array(z.string()).describe("Up to 8 skills, most evidenced first."),
    reason: z.string(),
  }),
});
export type ProfileSuggestionsOutput = z.infer<typeof ProfileSuggestionsSchema>;

export const VoiceProfileSchema = z.object({
  summary: z.string().describe("One sentence describing the user's voice."),
  notes: z.array(z.string()).describe("Up to 8 short observations about style only, most certain first."),
});

export const CommentStartersSchema = z.object({
  options: z.array(
    z.object({
      approach: z.string().describe("Short label, e.g. 'Add an example', 'Ask a question', 'Offer a different view'."),
      starter: z.string().describe("The first sentence or two of the comment, in the user's voice."),
      add: z.string().describe("What the user should add to finish it, e.g. 'Add a moment from your own work'."),
    }),
  ),
});
export type CommentStarters = z.infer<typeof CommentStartersSchema>;
