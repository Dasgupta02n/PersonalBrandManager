import { COMMENT_MAX_WORDS, POST_WORDS } from "@/lib/config/app";
import type { ConfidentialityRules } from "@/lib/domain/types";
import { CLICHE_PHRASES, JOB_SEARCH_PHRASES } from "./phrases";

export type GuardrailSeverity = "error" | "warning";
export type GuardrailCode =
  | "never_mention"
  | "employer_name"
  | "job_search"
  | "cliche"
  | "number_precision"
  | "length";

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
}

const normalize = (text: string) => text.replace(/[’‘]/g, "'");

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
 * is shown as ready; warnings are shown to the user.
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

  for (const phrase of CLICHE_PHRASES) {
    const match = findTerm(text, phrase);
    if (match) {
      issues.push({ code: "cliche", severity: "error", message: `"${match}" is an overused phrase.`, match });
    }
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
