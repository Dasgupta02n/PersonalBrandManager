import type { ConfidentialityRules } from "@/lib/domain/types";
import { checkText, type GuardrailIssue } from "@/lib/guardrails/check";
import type { NetworkKind } from "./taxonomy";

// Private messages the user sends themselves. They are checked like a post for what must never
// leave the company (never-mention terms, figures, unannounced plans), but naming your own
// employer is normal in a private note, and telling a search consultant you're open to a move is
// the point of writing to them. To anyone else, a job-hunt phrase is flagged: messages get
// forwarded.

const PLACEHOLDER = "{first_name}";

/** The settings for a private message: naming the employer is fine unless the user said never. */
export function privateMessageRules(rules: ConfidentialityRules): ConfidentialityRules {
  return rules.employerPolicy === "generic" ? { ...rules, employerPolicy: "name" } : rules;
}

export function checkMessage(
  text: string,
  options: { rules: ConfidentialityRules; kind: NetworkKind; avoidWords?: string[] },
): GuardrailIssue[] {
  const { issues } = checkText(text, {
    kind: "comment",
    rules: privateMessageRules(options.rules),
    commentMaxWords: 10_000,
    flagClientNames: true,
    avoidWords: options.avoidWords,
  });
  return issues
    .filter((issue) => issue.code !== "length" && !(issue.code === "job_search" && options.kind === "search_firm"))
    .map((issue) =>
      issue.code === "job_search"
        ? { ...issue, severity: "warning" as const, message: `"${issue.match}" reads as a job search. Messages get forwarded; keep this one about their work.` }
        : issue,
    );
}

export function firstNameOf(name: string | null | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0]?.replace(/[^\p{L}'-]/gu, "");
  return first && first.length > 1 ? first : null;
}

/** Puts the contact's first name into the draft; the model only ever sees the placeholder. */
export function fillName(text: string, firstName: string | null): string {
  return text.replaceAll(PLACEHOLDER, firstName ?? "there");
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Replaces the contact's name in the user's notes with the placeholder before they go to the model. */
export function maskName(text: string, name: string | null | undefined): string {
  const parts = [name?.trim() ?? "", ...(name?.trim().split(/\s+/) ?? [])].filter((p) => p.length >= 2);
  let masked = text;
  for (const part of [...new Set(parts)].sort((a, b) => b.length - a.length)) {
    masked = masked.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(part)}(?![\\p{L}\\p{N}])`, "giu"), PLACEHOLDER);
  }
  return masked.replace(/\{first_name\}(?:\s+\{first_name\})+/g, PLACEHOLDER);
}
