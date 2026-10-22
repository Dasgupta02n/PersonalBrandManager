import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgePercent, CalendarCheck, Check, CreditCard, RefreshCcw } from "lucide-react";
import { AsideCard, InfoPage, InfoSection, JsonLd } from "@/components/public-shell";
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
      aside={
        <AsideCard
          title="Good to know"
          items={[
            { icon: CalendarCheck, text: "We email you before anything is charged" },
            { icon: RefreshCcw, text: "Cancel in one step; keep access to the end of your period" },
            {
              icon: BadgePercent,
              text: `Yearly is ${formatUsd(PRICES.annual.usd)}: ${annualMonthsFree() === 1 ? "one month" : `${annualMonthsFree()} months`} free`,
            },
            { icon: CreditCard, text: "Payments by Paddle; card details never reach us" },
          ]}
        />
      }
      intro={
        <p>
          {APP_NAME} is free during the private beta. After that there is one plan at one price in every country:{" "}
          {formatUsd(PRICES.trial.usd)} for the first {TRIAL_DAYS} days, then {formatUsd(PRICES.monthly.usd)} a month or{" "}
          {formatUsd(PRICES.annual.usd)} a year, in US dollars plus local tax.
        </p>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div data-reveal className="card flex flex-col gap-3 p-7">
          <p className="eyebrow">Your first month</p>
          <p className="flex items-baseline gap-2">
            <span className="font-heading text-[52px] leading-none tracking-[-0.05em]">{formatUsd(PRICES.trial.usd)}</span>
            <span className="text-muted">for {TRIAL_DAYS} days</span>
          </p>
          <p className="text-muted">Everything in membership, with a third of the monthly allowance.</p>
        </div>
        <div data-reveal className="site-dark glow-border flex flex-col gap-3 rounded-[1.4rem] p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">Membership</p>
            <span className="rounded-full bg-brass-soft px-2.5 py-0.5 text-[12px] font-semibold text-brass">Free in beta</span>
          </div>
          <p className="flex items-baseline gap-2">
            <span className="font-heading text-[52px] leading-none tracking-[-0.05em]">{formatUsd(PRICES.monthly.usd)}</span>
            <span className="text-muted">a month</span>
          </p>
          <p className="text-muted">
            or {formatUsd(PRICES.annual.usd)} a year, {annualMonthsFree() === 1 ? "one month" : `${annualMonthsFree()} months`} free
          </p>
        </div>
      </div>
      <Link href="/login" className="btn btn-gold btn-lg self-start">
        Join the free beta
        <ArrowRight aria-hidden />
      </Link>

      <InfoSection title="Everything included">
        <ul className="grid gap-3 sm:grid-cols-2">
          {INCLUDED.map((item) => (
            <li key={item} className="card flex items-start gap-3 p-4 !pl-4 before:!hidden">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success-soft">
                <Check aria-hidden className="size-3.5 text-success" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection title="Billing, plainly">
        <dl className="grid gap-3 sm:grid-cols-2">
          {BILLING.map((b) => (
            <div key={b.q} className="card flex flex-col gap-1.5 p-5">
              <dt className="font-heading text-[17px] tracking-[-0.02em] text-foreground">{b.q}</dt>
              <dd className="text-[15.5px] leading-relaxed">{b.a}</dd>
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
