import { COMMENT_MAX_WORDS, POST_WORDS } from "@/lib/config/app";
import type { ConfidentialityRules } from "@/lib/domain/types";
import {
  AI_TELL_PHRASES,
  CLICHE_PHRASES,
  HUMBLEBRAG_PHRASES,
  JOB_SEARCH_PHRASES,
  REGULATED_PHRASES,
  SENSITIVE_PHRASES,
} from "./phrases";

export type GuardrailSeverity = "error" | "warning";
export type GuardrailCode =
  | "never_mention"
  | "employer_name"
  | "job_search"
  | "cliche"
  | "humblebrag"
  | "ai_tell"
  | "number_precision"
  | "regulated_language"
  | "sensitive"
  | "names_client"
  | "style_avoid"
  | "length";

/**
 * How loudly an issue is shown. Tier 1 (confidentiality) blocks copying until fixed or
 * acknowledged; tier 2 is an inline note; tier 3 is a quiet suggestion. Few, specific
 * warnings get read; many generic ones get ignored.
 */
export type GuardrailTier = 1 | 2 | 3;

const TIER_BY_CODE: Record<GuardrailCode, GuardrailTier> = {
  never_mention: 1,
  employer_name: 1,
  number_precision: 1,
  regulated_language: 1,
  job_search: 2,
  sensitive: 2,
  names_client: 2,
  style_avoid: 3,
  cliche: 3,
  humblebrag: 3,
  ai_tell: 3,
  length: 3,
};

export function issueTier(code: GuardrailCode): GuardrailTier {
  return TIER_BY_CODE[code];
}

export interface GuardrailIssue {
  code: GuardrailCode;
  severity: GuardrailSeverity;
  message: string;
  match?: string;
}

export interface GuardrailResult {
  passed: boolean;
  issues: GuardrailIssue[];
}

export interface GuardrailOptions {
  kind: "post" | "comment" | "reply";
  rules: ConfidentialityRules;
  postWords?: { min: number; max: number };
  commentMaxWords?: number;
  /** Flags phrases like "our client Acme". For the free checker, which has no never-mention list. */
  flagClientNames?: boolean;
  /** Words this user keeps removing from drafts (from their style notebook). */
  avoidWords?: string[];
}

const normalize = (text: string) => text.replace(/[’‘]/g, "'");

/** "It's not about X, it's Y" and close variants. */
const NOT_X_BUT_Y = /\b(?:it's|it is|this isn't|this is not)\s+(?:just\s+)?(?:about\s+)?[^.?!\n]{1,60}?[,;—–-]\s*(?:it's|it is)\b[^.?!\n]*/i;

/** "12% returns", "returned 18%": performance figures a regulated firm must not post. */
const RETURNS_FIGURE = /\b(?:\d+(?:\.\d+)?\s?%\s+(?:annual(?:ised|ized)?\s+)?returns?|returns?\s+of\s+(?:up\s+to\s+)?\d+(?:\.\d+)?\s?%|returned\s+\d+(?:\.\d+)?\s?%)/i;

/** "our client Acme Bank", "clients like Northwind": a named client. */
const NAMED_CLIENT = /\b[Cc]lients?(?:[ \t]+like|[ \t]+such[ \t]+as)?,?[ \t]+((?:[A-Z][\p{L}&.'-]*)(?:[ \t]+[A-Z][\p{L}&.'-]*){0,3})/gu;
const NOT_A_NAME = new Set(["I", "We", "The", "A", "An", "Our", "My", "In", "On", "At", "For", "This", "That", "It", "They"]);

/** A final line that only fishes for engagement. */
const BAIT_CLOSER = /^(?:agree|thoughts|right|who's with me|am i wrong)\s*\?+$/i;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive match of a term that is not part of a longer word. */
export function findTerm(text: string, term: string): string | null {
  const cleaned = normalize(term).trim();
  if (!cleaned) return null;
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(cleaned)}(?![\\p{L}\\p{N}])`, "iu");
  const match = normalize(text).match(pattern);
  return match ? match[0] : null;
}

/** Word count, ignoring hashtags. */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0 && !token.startsWith("#")).length;
}

// Business figures: optional currency, digits with optional grouping and decimals, optional unit.
const NUMBER_PATTERN =
  /(?<![\p{L}\p{N}.,])([₹$€£]\s?)?(\d{1,3}(?:,\d{2,3})+|\d+)(\.\d+)?(\s?%|\s?(?:crores?|cr|lakhs?|million|mn|billion|bn|k|m)\b)?/giu;

function significantDigits(integerPart: string): number {
  const trimmed = integerPart.replace(/^0+/, "").replace(/0+$/, "");
  return Math.max(trimmed.length, 1);
}

interface FigureMatch {
  text: string;
  precise: boolean;
}

/** Finds figures that look like business metrics (money, percentages, large counts). */
export function findBusinessFigures(text: string): FigureMatch[] {
  const figures: FigureMatch[] = [];
  for (const match of text.matchAll(NUMBER_PATTERN)) {
    const [full, currency, rawInteger, fraction, unit] = match;
    const integerPart = rawInteger.replace(/,/g, "");
    const value = Number(integerPart);
    const looksLikeYear = integerPart.length === 4 && !fraction && value >= 1900 && value <= 2099;
    const isFigure = Boolean(currency) || Boolean(unit) || (integerPart.length >= 4 && !looksLikeYear);
    if (!isFigure) continue;
    figures.push({
      text: full.trim(),
      precise: Boolean(fraction) || significantDigits(integerPart) > 2,
    });
  }
  return figures;
}

/**
 * Deterministic checks that run before the AI check. Errors must be fixed before a draft
 * is shown as ready; warnings are suggestions.
 */
export function checkText(text: string, options: GuardrailOptions): GuardrailResult {
  const issues: GuardrailIssue[] = [];
  const { rules } = options;

  for (const term of rules.neverMention) {
    const match = findTerm(text, term);
    if (match) {
      issues.push({
        code: "never_mention",
        severity: "error",
        message: `Mentions "${match}", which is on your never-mention list.`,
        match,
      });
    }
  }

  if (rules.employerName && rules.employerPolicy !== "name") {
    const match = findTerm(text, rules.employerName);
    if (match) {
      issues.push({
        code: "employer_name",
        severity: "error",
        message:
          rules.employerPolicy === "never"
            ? "Mentions your employer, which your settings say never to do."
            : "Names your employer; your settings say to refer to it generically.",
        match,
      });
    }
  }

  for (const phrase of JOB_SEARCH_PHRASES) {
    const match = findTerm(text, phrase);
    if (match) {
      issues.push({
        code: "job_search",
        severity: "error",
        message: `"${match}" can signal a job search.`,
        match,
      });
    }
  }

  if (rules.regulated) {
    for (const phrase of REGULATED_PHRASES) {
      const match = findTerm(text, phrase);
      if (match) {
        issues.push({
          code: "regulated_language",
          severity: "error",
          message: `"${match}" is promissory or performance language your firm's rules don't allow in a post.`,
          match,
        });
      }
    }
    const returns = text.match(RETURNS_FIGURE);
    if (returns) {
      issues.push({
        code: "regulated_language",
        severity: "error",
        message: `"${returns[0]}" quotes performance; regulated firms generally don't allow that in a personal post.`,
        match: returns[0],
      });
    }
  }

  for (const phrase of SENSITIVE_PHRASES) {
    const match = findTerm(text, phrase);
    if (match) {
      issues.push({
        code: "sensitive",
        severity: "warning",
        message: `"${match}" suggests information that may not be public yet. Check you're allowed to share it.`,
        match,
      });
    }
  }

  if (options.flagClientNames) {
    for (const match of text.matchAll(NAMED_CLIENT)) {
      const name = match[1];
      if (NOT_A_NAME.has(name.split(/\s+/)[0])) continue;
      issues.push({
        code: "names_client",
        severity: "warning",
        message: `Names a client ("${name}"). Check you have their permission, or describe them generally.`,
        match: name,
      });
      break;
    }
  }

  const phraseChecks: [readonly string[], GuardrailCode, (match: string) => string][] = [
    [CLICHE_PHRASES, "cliche", (m) => `"${m}" is an overused phrase.`],
    [HUMBLEBRAG_PHRASES, "humblebrag", (m) => `"${m}" reads as a humblebrag; state the result plainly instead.`],
    [AI_TELL_PHRASES, "ai_tell", (m) => `"${m}" is a phrase readers associate with AI-written posts.`],
  ];
  for (const [phrases, code, message] of phraseChecks) {
    for (const phrase of phrases) {
      const match = findTerm(text, phrase);
      if (match) issues.push({ code, severity: "warning", message: message(match), match });
    }
  }

  for (const word of options.avoidWords ?? []) {
    const match = findTerm(text, word);
    if (match) {
      issues.push({ code: "style_avoid", severity: "warning", message: `You usually remove "${match}" from your posts.`, match });
    }
  }

  const contrast = normalize(text).match(NOT_X_BUT_Y);
  if (contrast) {
    issues.push({
      code: "ai_tell",
      severity: "warning",
      message: `"${contrast[0].trim()}" follows the "it's not X, it's Y" pattern readers associate with AI.`,
      match: contrast[0].trim(),
    });
  }

  const lastLine = normalize(text).trim().split("\n").at(-1)?.trim() ?? "";
  if (BAIT_CLOSER.test(lastLine)) {
    issues.push({
      code: "ai_tell",
      severity: "warning",
      message: `Ending on "${lastLine}" reads as engagement bait; ask a specific question instead.`,
      match: lastLine,
    });
  }

  const hashtags = text.match(/(^|\s)#[\p{L}\p{N}_]+/gu)?.length ?? 0;
  if (hashtags > 3) {
    issues.push({ code: "ai_tell", severity: "warning", message: `${hashtags} hashtags; use three or fewer.` });
  }

  if (rules.numberPolicy !== "exact") {
    for (const figure of findBusinessFigures(text)) {
      if (rules.numberPolicy === "relative") {
        issues.push({
          code: "number_precision",
          severity: "error",
          message: `"${figure.text}" is a specific figure; your settings say to use relative terms only.`,
          match: figure.text,
        });
      } else if (figure.precise) {
        issues.push({
          code: "number_precision",
          severity: "error",
          message: `"${figure.text}" is very precise; your settings say to round figures.`,
          match: figure.text,
        });
      }
    }
  }

  const words = countWords(text);
  if (options.kind === "post") {
    const range = options.postWords ?? POST_WORDS;
    if (words < range.min || words > range.max) {
      issues.push({
        code: "length",
        severity: "warning",
        message: `${words} words; aim for ${range.min}–${range.max}.`,
      });
    }
  } else {
    const max = options.commentMaxWords ?? COMMENT_MAX_WORDS;
    if (words > max) {
      issues.push({ code: "length", severity: "warning", message: `${words} words; keep it under ${max}.` });
    }
  }

  return { passed: !issues.some((issue) => issue.severity === "error"), issues };
}

/**
 * Replaces never-mention terms with a neutral placeholder, longest first, so private names are
 * not stored in notes. Used when the user keeps names out of their record.
 */
export function maskTerms(text: string, terms: string[]): string {
  const present = terms.filter((term) => findTerm(text, term));
  if (!present.length) return text;
  let masked = normalize(text);
  for (const term of present.sort((a, b) => b.length - a.length)) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(normalize(term).trim())}(?![\\p{L}\\p{N}])`, "giu");
    masked = masked.replace(pattern, "[private]");
  }
  return masked;
}
