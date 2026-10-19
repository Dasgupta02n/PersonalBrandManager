import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Meter, PageHeader, Panel, buttonClass } from "@/components/ui";
import { loadAllowance } from "@/lib/billing/allowance";
import { NEAR_LIMIT, exhaustedMessage, isExhausted } from "@/lib/billing/allowance-period";
import { PRICES, TRIAL_DAYS, annualMonthsFree, formatUsd, type PlanKind } from "@/lib/billing/pricing";
import { PRIVACY_EMAIL } from "@/lib/config/app";
import { requireUser } from "@/lib/data/session";
import { DeleteAccountForm } from "./delete-form";

export const metadata: Metadata = { title: "Plan, data and privacy" };

const PLAN_LABEL: Record<PlanKind, string> = {
  beta: "Private beta",
  trial: "Trial",
  member: "Member",
};

const formatDate = (value: Date | string) =>
  new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function usageWords(used: number) {
  if (used >= 1) return "All of it used";
  if (used >= NEAR_LIMIT) return "Most of it used";
  if (used >= 0.5) return "About half used";
  return "Plenty left";
}

export default async function AccountPage() {
  const { supabase, user } = await requireUser({ allowMissingConsent: true });
  const [allowance, consent] = await Promise.all([
    loadAllowance(user.id),
    supabase.from("profiles").select("privacy_consent_at, privacy_notice_version").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <>
      <div>
        <Link href="/onboarding" className={buttonClass("ghost", "-ml-3 px-3", "sm")}>
          <ArrowLeft aria-hidden />
          Settings
        </Link>
        <div className="mt-2">
          <PageHeader title="Plan, data and privacy" />
        </div>
      </div>

      <Panel className="flex flex-col gap-4">
        <h2 className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Your plan</h2>
        {allowance ? (
          <>
            <p className="text-lg font-semibold">{PLAN_LABEL[allowance.plan]}</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>{allowance.plan === "trial" ? "This trial" : "This month"}</span>
                <span className="text-muted">{usageWords(allowance.used)}</span>
              </div>
              <Meter value={allowance.used} label="Allowance used" />
              <p className="text-[13px] text-muted">
                {isExhausted(allowance)
                  ? exhaustedMessage(allowance)
                  : allowance.renewsOn
                    ? `Renews on ${formatDate(allowance.renewsOn)}.`
                    : `Your trial runs for ${TRIAL_DAYS} days.`}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">Usage isn&apos;t measured on this server.</p>
        )}
        <div className="border-t border-border pt-4 text-sm leading-relaxed text-muted">
          <p>
            <span className="font-semibold text-foreground">Membership:</span> {formatUsd(PRICES.monthly.usd)} a month, or{" "}
            {formatUsd(PRICES.annual.usd)} a year ({annualMonthsFree() === 1 ? "one month" : `${annualMonthsFree()} months`} free). The
            first month is {formatUsd(PRICES.trial.usd)}. One price
            everywhere; local tax is added at checkout where it applies.
          </p>
          <p className="mt-2">
            Every plan has a fair-use allowance that covers daily logging and an active month of drafting. You&apos;ll see a
            note only when you&apos;re close to it. The private beta is free.
          </p>
        </div>
      </Panel>

      <Panel className="flex flex-col gap-4">
        <h2 className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Your data</h2>
        <div>
          <p className="text-[15px] leading-relaxed">Everything you&apos;ve stored, in one file: notes, wins, drafts, settings.</p>
          <a href="/account/export" className={buttonClass("secondary", "mt-3", "sm")} download>
            <Download aria-hidden />
            Download everything
          </a>
        </div>
        <details className="group border-t border-border pt-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 text-[15px] font-semibold text-danger">
            Delete my account
            <span aria-hidden className="transition group-open:rotate-90">
              ›
            </span>
          </summary>
          <p className="mt-1 mb-3 text-sm leading-relaxed text-muted">
            Removes your notes, wins, drafts and settings straight away. This can&apos;t be undone. Download your data first if
            you want to keep it.
          </p>
          <DeleteAccountForm />
        </details>
      </Panel>

      <Panel className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Privacy</h2>
        <p className="text-[15px] leading-relaxed">
          Your data is stored in Mumbai, India. AI runs with zero data retention and is never trained on what you write. We never
          sell or share it.{" "}
          <Link href="/privacy" className="link">
            Privacy notice
          </Link>
        </p>
        {consent.data?.privacy_consent_at && (
          <p className="text-sm text-muted">
            You agreed to the privacy notice on {formatDate(consent.data.privacy_consent_at)}. To withdraw consent, delete your
            account.
          </p>
        )}
        <p className="text-sm text-muted">
          Questions, corrections or complaints:{" "}
          <a href={`mailto:${PRIVACY_EMAIL}`} className="link">
            {PRIVACY_EMAIL}
          </a>
        </p>
      </Panel>
    </>
  );
}
