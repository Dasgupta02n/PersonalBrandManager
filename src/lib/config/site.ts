import { PRICES, TRIAL_DAYS, annualMonthsFree, formatUsd } from "@/lib/billing/pricing";
import { FIRMS } from "@/lib/network/firms";
import { APP_NAME, APP_PROMISE } from "./app";

// Public facts about Winwall and who runs it. Every public page, the structured data and llms.txt
// read from here, so a person and an AI assistant see the same answer everywhere.

/** The canonical site address. Change it here when the site moves to winwall.app. */
export const SITE_URL = "https://c7xai.in";

/** One-sentence definition used in metadata, structured data and the facts block. */
export const SITE_DESCRIPTION =
  "A private career tool for senior professionals: a record of your work wins, LinkedIn drafts checked for confidential details and job-hunt signals before you post them yourself, and a private network of the executive search firms and people at competitors who bring the next role.";

export const CONTACT = {
  hello: "hello@c7xai.in",
  privacy: "privacy@c7xai.in",
  security: "hello@c7xai.in",
} as const;

/**
 * Who runs Winwall. Unset values are left off the site rather than guessed; they are needed
 * before payments open (terms, footer, grievance officer).
 */
export const OPERATOR: {
  founderName: string | null;
  city: string | null;
  legalName: string | null;
  address: string | null;
  linkedin: string | null;
} = {
  founderName: null,
  city: null,
  legalName: null,
  address: null,
  linkedin: null,
};

/** "[name], an independent founder in [city], India", using what is known. */
export function operatorLine(): string {
  const who = OPERATOR.founderName ? `${OPERATOR.founderName}, an independent founder` : "an independent founder";
  return `${who} ${OPERATOR.city ? `in ${OPERATOR.city}, India` : "based in India"}`;
}

export const PRICE_LINE = `Free during the private beta. Then ${formatUsd(PRICES.trial.usd)} for the first ${TRIAL_DAYS} days and ${formatUsd(
  PRICES.monthly.usd,
)} a month, or ${formatUsd(PRICES.annual.usd)} a year (${annualMonthsFree() === 1 ? "one month" : `${annualMonthsFree()} months`} free), in US dollars plus local tax.`;

/** The facts block: stated the same way on the home page, About and Pricing. */
export const FACTS: { label: string; value: string }[] = [
  { label: "What it is", value: SITE_DESCRIPTION },
  { label: "Who it's for", value: "Managers, directors and senior specialists in employment, in India, the UAE, the UK, Singapore and the US" },
  { label: "Price", value: PRICE_LINE },
  { label: "Run by", value: operatorLine().replace(/^an/, "An") },
  { label: "Your data", value: "Stored on our own server in Mumbai, India. Never sold, never used to train AI." },
  { label: "Network", value: `Executive search firms matched to your answers from a directory of ${FIRMS.length} firms checked on their own websites, roles worth knowing at your competitors, and a private log of every conversation and follow-up.` },
  { label: "LinkedIn", value: "Never accessed or automated. You copy a draft and post it yourself, and you send every message yourself." },
];

/** Public pages, in site-map order. `updated` is the date the page's content last really changed. */
export const PUBLIC_PAGES: { path: string; title: string; group: "Product" | "Trust" | "Company"; updated: string }[] = [
  { path: "/", title: `${APP_NAME}: ${APP_PROMISE}`, group: "Product", updated: "2026-10-23" },
  { path: "/how-it-works", title: `How ${APP_NAME} works and uses AI`, group: "Product", updated: "2026-10-23" },
  { path: "/search-firms", title: "Executive search firms directory", group: "Product", updated: "2026-10-23" },
  { path: "/check", title: "Free LinkedIn post check", group: "Product", updated: "2026-10-22" },
  { path: "/pricing", title: "Pricing", group: "Product", updated: "2026-10-23" },
  { path: "/faq", title: "Questions and answers", group: "Product", updated: "2026-10-23" },
  { path: "/security", title: "Security", group: "Trust", updated: "2026-10-23" },
  { path: "/privacy", title: "Privacy notice", group: "Trust", updated: "2026-10-23" },
  { path: "/terms", title: "Terms of service", group: "Trust", updated: "2026-10-23" },
  { path: "/refunds", title: "Refunds and cancellation", group: "Trust", updated: "2026-10-22" },
  { path: "/cookies", title: "Cookies", group: "Trust", updated: "2026-10-22" },
  { path: "/accessibility", title: "Accessibility", group: "Trust", updated: "2026-10-22" },
  { path: "/about", title: `About ${APP_NAME}`, group: "Company", updated: "2026-10-23" },
  { path: "/contact", title: "Contact and grievance officer", group: "Company", updated: "2026-10-22" },
  { path: "/site-map", title: "Site map", group: "Company", updated: "2026-10-23" },
];

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}
