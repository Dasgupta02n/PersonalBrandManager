import { PRICES, TRIAL_DAYS, formatUsd } from "@/lib/billing/pricing";
import { APP_NAME } from "@/lib/config/app";
import { operatorLine } from "@/lib/config/site";

// Questions answered on the public site, written answer-first in the reader's own words so a
// person (or an AI assistant quoting the page) gets the answer in the first sentence.

export interface Faq {
  id: string;
  q: string;
  a: string;
}

export const ABOUT_WINWALL: Faq[] = [
  {
    id: "employer",
    q: `Will my employer find out I use ${APP_NAME}?`,
    a: `Not from us. ${APP_NAME} never touches LinkedIn, has no public profile and no share links. Sign up with a personal email and no invite, receipt or reminder reaches your work inbox.`,
  },
  {
    id: "restrict",
    q: `Can LinkedIn restrict my account because of ${APP_NAME}?`,
    a: `No. ${APP_NAME} never logs in to LinkedIn, has no browser extension and automates nothing. You copy a draft and post it yourself, exactly as if you had written it in a notes app.`,
  },
  {
    id: "ai-visible",
    q: "Will anyone know I used AI?",
    a: "Drafts are built only from your own notes, in your voice, and learn from the edits you make. You can change every word, and we never add labels, links or tags to what you post.",
  },
  {
    id: "data",
    q: "What happens to what I write?",
    a: "It is stored on our own server in Mumbai, India, and sent to the AI model only to draft or check, with zero data retention. It is never sold and never used to train AI. You can download or delete everything at any time.",
  },
  {
    id: "regulated",
    q: "Can I use it in a regulated job, like banking?",
    a: "Yes. Regulated mode adds stricter checks for finance and similar roles. It is a careful second read, not compliance approval: your firm's rules still apply.",
  },
  {
    id: "often",
    q: "Do I have to post often?",
    a: "No. Many people use it only as a private record for appraisals and CV updates. There are no streaks and no posting targets.",
  },
  {
    id: "price",
    q: `How much does ${APP_NAME} cost?`,
    a: `It is free during the private beta. After that, the first ${TRIAL_DAYS} days cost ${formatUsd(PRICES.trial.usd)}, then ${formatUsd(
      PRICES.monthly.usd,
    )} a month or ${formatUsd(PRICES.annual.usd)} a year, in US dollars plus local tax. We email you before anything is charged, and you can cancel in one step.`,
  },
  {
    id: "who",
    q: `Who is behind ${APP_NAME}?`,
    a: `${operatorLine().replace(/^an/, "An")}. ${APP_NAME} is in private beta. Write to us and a person replies.`,
  },
];

/** Questions about LinkedIn and work that people ask before they ever look for a tool. */
export const ABOUT_POSTING: Faq[] = [
  {
    id: "safe-company",
    q: "Is it safe to post about my company on LinkedIn?",
    a: "Usually, if you share only what is already public, credit your team, and leave out clients, internal figures and anything not yet announced. Check your employer's social media policy first. When in doubt, describe things generically (\"a large retailer\") or ask before posting.",
  },
  {
    id: "client-name",
    q: "Can I mention a client's name on LinkedIn?",
    a: "Only with the client's permission or when the work is already public, and only if your contract and any non-disclosure agreement allow it. Otherwise describe the client so they can't be identified.",
  },
  {
    id: "employer-see",
    q: "Can my employer see my LinkedIn activity?",
    a: "Yes. Anything public on LinkedIn, including posts, comments and reactions, can be seen by colleagues and managers. That is why a careful check before posting matters.",
  },
  {
    id: "job-hunt",
    q: "Does posting on LinkedIn make it look like I'm job hunting?",
    a: "Not by itself. Phrases like \"open to new challenges\" or \"excited for what's next\", a sudden burst of posts, or a headline that reads like an advert can. Posts that share a lesson or credit a team rarely raise that question.",
  },
  {
    id: "without-bragging",
    q: "How do I talk about my achievements without bragging?",
    a: "Lead with what happened and what you learned, give credit to the people involved, use facts instead of adjectives, and connect the result to something useful for the reader. \"We cut onboarding from ten days to four, and here's what made the difference\" reads as helpful; \"Proud of what I built\" reads as boastful.",
  },
  {
    id: "track",
    q: "How do I keep track of my accomplishments at work?",
    a: "Write one line on the day it happens: what you did, the result, and who helped. A dated record beats memory at appraisal time, and it gives you material for your CV and LinkedIn profile.",
  },
  {
    id: "brag-document",
    q: "What is a brag document?",
    a: "A running list of your work achievements, kept for performance reviews and promotions. The idea was popularised by software engineer Julia Evans in her 2019 essay \"Get your work recognized: write a brag document\". A private, dated work record is the same idea, kept as you go.",
  },
  {
    id: "ai-ok",
    q: "Is it OK to use AI to help write LinkedIn posts?",
    a: "Yes, if the experience and the facts are yours and you review every word. What tends to do badly is generic text that could have come from anyone. Use AI as an editor for your own material, not as a ghost with opinions you don't hold.",
  },
  {
    id: "automation",
    q: "Is LinkedIn automation against the rules?",
    a: "LinkedIn's User Agreement does not allow bots or browser extensions that scrape, post, message or engage on your behalf, and accounts using them can be restricted. Writing a draft elsewhere and posting it yourself is not automation.",
  },
  {
    id: "4-1-1",
    q: "What is the 4-1-1 rule on LinkedIn?",
    a: "A content habit, not a LinkedIn rule: for every six posts, share four useful pieces from others, one update of your own and one direct ask. For employed professionals, one thoughtful post about real work matters more than any ratio.",
  },
  {
    id: "senior-post",
    q: "What should a senior professional post on LinkedIn?",
    a: "Lessons from real work, decisions you made and why, and credit to your team. Skip announcements that aren't yours to make, internal numbers and anything about clients. Once or twice a month is plenty if each post is useful.",
  },
];

export const HOME_FAQ_IDS = ["employer", "restrict", "ai-visible", "data", "regulated", "often", "who"];

export function faqPageJsonLd(items: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
