import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/client";
import { Notice, PageHeader, Panel } from "@/components/ui";
import { requireUser } from "@/lib/data/session";
import { recordConsent } from "../account/actions";

export const metadata: Metadata = { title: "Privacy notice" };

const POINTS = [
  "Your notes are used only to find your wins and suggest posts, your profile and your CV.",
  "Stored in Mumbai, India. AI runs with zero data retention and never learns from what you write.",
  "Nothing is posted for you. We never log in to or read your LinkedIn.",
  "Download or delete everything at any time from Settings.",
];

export default async function ConsentPage({ searchParams }: PageProps<"/consent">) {
  await requireUser({ allowMissingConsent: true });
  const missing = (await searchParams).missing === "1";

  return (
    <>
      <PageHeader title="One thing before you continue" description="We've written down how your data is handled. Please read it and agree." />
      <Panel className="flex flex-col gap-4">
        <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-relaxed">
          {POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <form action={recordConsent} className="flex flex-col gap-4">
          <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug">
            <input type="checkbox" name="consent" required className="mt-0.5 size-4 shrink-0 accent-[var(--ink)]" />
            <span>
              I agree to the{" "}
              <Link href="/privacy" target="_blank" className="link">
                privacy notice
              </Link>
              .
            </span>
          </label>
          {missing && <Notice tone="danger">Please tick the box to continue.</Notice>}
          <SubmitButton className="self-start" pendingLabel="Saving…">
            Continue
          </SubmitButton>
        </form>
      </Panel>
      <p className="text-sm text-muted">
        Don&apos;t agree?{" "}
        <Link href="/account" className="link">
          Download or delete your data
        </Link>
        .
      </p>
    </>
  );
}
