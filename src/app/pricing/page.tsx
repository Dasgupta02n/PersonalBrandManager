import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { InfoPage, InfoSection, JsonLd } from "@/components/public-shell";
import { buttonClass } from "@/components/ui";
import { PRICES, TRIAL_DAYS, annualMonthsFree, formatUsd } from "@/lib/billing/pricing";
import { APP_NAME } from "@/lib/config/app";
import { SITE_DESCRIPTION, SITE_URL, absoluteUrl } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Pricing: one plan, one price",
  description: `${APP_NAME} is free during the private beta. Then ${formatUsd(PRICES.trial.usd)} for the first ${TRIAL_DAYS} days and ${formatUsd(
    PRICES.monthly.usd,
  )} a month, the same in every country.`,
  alternates: { canonical: "/pricing" },
};

const INCLUDED = [
  "A one-minute daily note that builds your private record",
  "Checked LinkedIn drafts and comment starters, in your voice",
  "How it reads to peers, leadership and clients",
  "Profile and CV suggestions, appraisal exports, a weekly look back",
  "Regulated mode for finance and similar roles",
  "Download or delete everything at any time",
];

const BILLING = [
  {
    q: "When am I charged?",
    a: `Not during the beta. When billing opens, your first ${TRIAL_DAYS} days cost ${formatUsd(PRICES.trial.usd)}; membership starts after that only if you continue. We email you before the first month ends and before every renewal.`,
  },
  { q: "How do I cancel?", a: "In one step, in Settings. You keep access until the end of the period you paid for, with no fees." },
  {
    q: "What about tax?",
    a: "Prices are in US dollars and exclude sales tax, VAT or GST, which our payment provider adds where the law requires. You see the final price before you pay.",
  },
  {
    q: "Is there a limit?",
    a: "A fair-use allowance that covers daily logging and an active month of drafting. You'll only hear about it if you get close.",
  },
];

export default function PricingPage() {
  const product = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: APP_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    publisher: { "@id": `${SITE_URL}/#organization` },
    offers: [
      { "@type": "Offer", name: "Membership, monthly", price: String(PRICES.monthly.usd), priceCurrency: "USD", url: absoluteUrl("/pricing") },
      { "@type": "Offer", name: "Membership, annual", price: String(PRICES.annual.usd), priceCurrency: "USD", url: absoluteUrl("/pricing") },
      { "@type": "Offer", name: `First ${TRIAL_DAYS} days`, price: String(PRICES.trial.usd), priceCurrency: "USD", url: absoluteUrl("/pricing") },
    ],
  };

  return (
    <InfoPage
      path="/pricing"
      title="Pricing"
      updated="2026-10-22"
      intro={
        <p>
          {APP_NAME} is free during the private beta. After that there is one plan at one price in every country:{" "}
          {formatUsd(PRICES.trial.usd)} for the first {TRIAL_DAYS} days, then {formatUsd(PRICES.monthly.usd)} a month or{" "}
          {formatUsd(PRICES.annual.usd)} a year, in US dollars plus local tax.
        </p>
      }
    >
      <div className="flex flex-wrap gap-4">
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-3 rounded-3xl border border-border p-6">
          <p className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Your first month</p>
          <p className="font-display text-5xl font-medium">
            {formatUsd(PRICES.trial.usd)}
            <span className="ml-2 font-sans text-base font-normal text-muted">for {TRIAL_DAYS} days</span>
          </p>
          <p className="text-foreground/80">Everything in membership, with a third of the monthly allowance.</p>
        </div>
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-3 rounded-3xl bg-ink p-6 text-ink-foreground">
          <p className="text-[13px] font-semibold tracking-[0.06em] uppercase opacity-80">Membership</p>
          <p className="font-display text-5xl font-medium">
            {formatUsd(PRICES.monthly.usd)}
            <span className="ml-2 font-sans text-base font-normal opacity-80">a month</span>
          </p>
          <p className="opacity-85">
            or {formatUsd(PRICES.annual.usd)} a year, {annualMonthsFree() === 1 ? "one month" : `${annualMonthsFree()} months`} free
          </p>
        </div>
      </div>
      <Link href="/login" className={buttonClass("primary", "self-start", "lg")}>
        Join the free beta
      </Link>

      <InfoSection title="Everything included">
        <ul className="!list-none !pl-0">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CircleCheck aria-hidden className="mt-1 size-5 shrink-0 text-success" />
              {item}
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection title="Billing, plainly">
        <dl className="flex flex-col gap-4">
          {BILLING.map((b) => (
            <div key={b.q}>
              <dt className="font-semibold text-foreground">{b.q}</dt>
              <dd>{b.a}</dd>
            </div>
          ))}
        </dl>
        <p>
          Refunds follow our{" "}
          <Link href="/refunds" className="link">
            refunds and cancellation policy
          </Link>
          . Payments will be handled by Paddle as merchant of record; card details never reach us.
        </p>
      </InfoSection>
      <JsonLd data={product} />
    </InfoPage>
  );
}
