import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/public-shell";
import { PRICES, TRIAL_DAYS, formatUsd } from "@/lib/billing/pricing";
import { APP_NAME } from "@/lib/config/app";
import { CONTACT, OPERATOR } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: `The terms for using ${APP_NAME} during the private beta and after: your content, your decisions, plans, payment and cancellation.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const operator = OPERATOR.legalName ?? `the founder of ${APP_NAME}`;
  return (
    <InfoPage
      path="/terms"
      title="Terms of service"
      updated="2026-10-22"
      intro={
        <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-subtle">
          <li>Your notes and drafts are yours. We use them only to run the service for you.</li>
          <li>You decide what to post. Our checks are a careful second read, not legal or compliance advice.</li>
          <li>The service is free during the private beta. Paid plans will be sold by Paddle as our merchant of record.</li>
          <li>Cancel any time; you keep access until the end of the period you paid for.</li>
        </ul>
      }
    >
      <p className="rounded-lg bg-surface px-5 py-4 text-[16px] leading-relaxed">
        This is the plain-language version for the private beta. A lawyer-reviewed version will replace it before payments open, and
        we&apos;ll tell you before it takes effect.
      </p>

      <InfoSection title="1. Who we are">
        <p>
          {APP_NAME} is operated by {operator}
          {OPERATOR.address ? `, ${OPERATOR.address}` : ", India"} (&ldquo;we&rdquo;). Contact: {CONTACT.hello}.
        </p>
      </InfoSection>

      <InfoSection title="2. The service">
        <p>
          {APP_NAME} keeps a private record of your work, drafts LinkedIn posts and profile text from it, and checks drafts before you
          use them. It never accesses your LinkedIn account and never posts for you. You must be 18 or over to use it.
        </p>
      </InfoSection>

      <InfoSection title="3. The beta">
        <p>
          During the private beta the service is free. Features may change, and we may pause or end the beta; if we end it, we&apos;ll
          give you notice and a way to download everything first.
        </p>
      </InfoSection>

      <InfoSection title="4. Plans and payment, after the beta">
        <p>
          The first {TRIAL_DAYS} days cost {formatUsd(PRICES.trial.usd)}; membership then costs {formatUsd(PRICES.monthly.usd)} a month or{" "}
          {formatUsd(PRICES.annual.usd)} a year, in US dollars plus any local tax shown at checkout. We email you before the first month
          ends and before every renewal. Our order process will be conducted by our online reseller Paddle.com, which is the merchant of
          record for all our orders and handles billing, tax and refunds under its buyer terms.
        </p>
      </InfoSection>

      <InfoSection title="5. Your content">
        <p>
          You own everything you write in {APP_NAME}. You give us permission to store and process it only to provide the service to you.
          We never sell it, show it to anyone else or use it to train AI. You can download or delete it at any time.
        </p>
      </InfoSection>

      <InfoSection title="6. What you post is your decision">
        <p>
          Drafts and checks help you decide; they are not legal, compliance, HR or employment advice, and they can miss things. You are
          responsible for what you publish and for following your employer&apos;s policies and your industry&apos;s rules.
        </p>
      </InfoSection>

      <InfoSection title="7. Fair use">
        <p>
          Each plan includes a fair-use allowance that covers daily logging and an active month of drafting. Don&apos;t use {APP_NAME} to
          break the law, to harass or impersonate anyone, to probe or overload our systems, or to resell the service.
        </p>
      </InfoSection>

      <InfoSection title="8. Ending the service">
        <p>
          You can delete your account at any time in Settings, which deletes your data as described in our{" "}
          <Link href="/privacy" className="link">
            privacy notice
          </Link>
          . We may suspend an account that breaks these terms, and will tell you why.
        </p>
      </InfoSection>

      <InfoSection title="9. Liability">
        <p>
          We work hard to keep {APP_NAME} accurate, available and secure, but during the beta it is provided as it is. Nothing in these
          terms limits rights you have under the consumer law where you live.
        </p>
      </InfoSection>

      <InfoSection title="10. Law and changes">
        <p>
          These terms are governed by the laws of India, without removing the protection of the law where you live. If we change them in
          a way that matters, we&apos;ll tell you in advance.
        </p>
      </InfoSection>

      <InfoSection id="changes" title="What changed">
        <p>22 October 2026: first version.</p>
      </InfoSection>
    </InfoPage>
  );
}
