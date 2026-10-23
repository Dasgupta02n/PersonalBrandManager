import type { ConfidentialityRules } from "@/lib/domain/types";
import type { PrivacyHints } from "./pseudonymise";

/**
 * What to keep away from the AI model for this user: their own name and the people in their
 * network, their never-mention terms, and their employer when the rule says not to name it.
 */
export function privacyHints(
  ctx: { fullName?: string | null; knownPeople?: string[]; rules: ConfidentialityRules },
  options: { restorePeople?: boolean } = {},
): PrivacyHints {
  const terms = [...ctx.rules.neverMention];
  if (ctx.rules.employerName && ctx.rules.employerPolicy !== "name") terms.push(ctx.rules.employerName);
  return {
    knownPeople: [ctx.fullName ?? "", ...(ctx.knownPeople ?? [])].filter((n) => n.trim().length >= 2),
    privateTerms: terms.filter((t) => t.trim().length >= 2),
    restorePeople: options.restorePeople ?? true,
  };
}
