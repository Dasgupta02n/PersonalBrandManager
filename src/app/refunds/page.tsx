import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/public-shell";
import { PRICES, TRIAL_DAYS, formatUsd } from "@/lib/billing/pricing";
import { APP_NAME } from "@/lib/config/app";
import { CONTACT } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Refunds and cancellation",
  description: `How cancelling and refunds work for ${APP_NAME}: cancel in one step, reminders before every charge, and your statutory rights.`,
  alternates: { canonical: "/refunds" },
};

export default function RefundsPage() {
  return (
    <InfoPage
      path="/refunds"
      title="Refunds and cancellation"
      updated="2026-10-22"
      intro={
        <p>
          {APP_NAME} is free during the private beta, so there is nothing to refund yet. When billing opens: cancel any time in one step,
          we remind you before every charge, and your statutory refund rights always apply.
        </p>
      }
    >
      <InfoSection title="Cancelling">
        <ul>
          <li>Cancel any time in Settings, in one step. No fees and no questions.</li>
          <li>You keep access until the end of the period you&apos;ve paid for, then your plan stops renewing.</li>
          <li>Your record stays yours: download everything before or after cancelling, or delete your account.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Reminders before you pay">
        <p>
          Your first {TRIAL_DAYS} days cost {formatUsd(PRICES.trial.usd)}. We email you before they end and before every renewal, with
          the amount and the date, so a charge is never a surprise.
        </p>
      </InfoSection>

      <InfoSection title="Refunds">
        <ul>
          <li>
            Payments are processed by Paddle, our merchant of record, and refunds are made through Paddle under its buyer terms.
          </li>
          <li>
            Where the law gives you a right to cancel and get your money back, such as within 14 days of your first payment in the UK and
            the EU, you have it. Nothing in this policy reduces your statutory rights.
          </li>
          <li>
            Outside those rules, write to {CONTACT.hello} and a person will look at your request fairly, especially if something
            didn&apos;t work as it should.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Delivery">
        <p>{APP_NAME} is an online service, available as soon as you sign in. Nothing is shipped.</p>
      </InfoSection>
    </InfoPage>
  );
}
