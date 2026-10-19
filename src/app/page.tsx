import Link from "next/link";
import { ArrowRight, Ban, Check, CircleCheck, Lock, Minus, NotebookPen, ShieldCheck, Unplug } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/public-shell";
import { Notice, buttonClass } from "@/components/ui";
import { PRICES, TRIAL_DAYS, annualMonthsFree, formatUsd } from "@/lib/billing/pricing";
import { APP_NAME, APP_PROMISE, APP_TAGLINE } from "@/lib/config/app";

const QUESTIONS = [
  {
    q: "What do I post?",
    a: "Your one-line daily note builds a private record of real work. Each one becomes three ways to share it: a lesson, a decision explained, or credit to your team.",
  },
  {
    q: "Will it be well received?",
    a: "Before you post, see how a peer, your leadership and a client or recruiter would likely read it. Boastful or AI-sounding lines are flagged, with a fix.",
  },
  {
    q: "Will it clash with my job, or with who I am?",
    a: "Every draft is checked against your employer rules, your never-mention list, your no-go topics and job-hunting signals, in your own tone.",
  },
  {
    q: "How do I even write it?",
    a: "That's the easy part. The draft is written in your voice from your own words; one tap makes it shorter or more modest. You add the final line.",
  },
];

const PROOFS = [
  {
    icon: ShieldCheck,
    title: "Checked before you see it",
    body: "Client names, internal figures, things not yet public and job-hunting signals are caught on every draft, against your own rules.",
  },
  {
    icon: NotebookPen,
    title: "A record that keeps paying off",
    body: "The same private record gives you your appraisal summary, a fresh CV and profile, and your year in wins, even in weeks you don't post.",
  },
  {
    icon: Unplug,
    title: "We never touch your LinkedIn account",
    body: "No extension, no automation, no LinkedIn login. You copy the post and publish it yourself.",
  },
];

const COMPARISON: { row: string; assistant: string | false; us: string }[] = [
  { row: "Knows your real work", assistant: "Only what you paste in each time", us: "A private record, a minute a day" },
  { row: "Checks for client names, figures and things not yet public", assistant: false, us: "Every draft, against your rules" },
  { row: "Reads it as your leadership and clients would", assistant: false, us: "Every draft" },
  { row: "Keeps job-hunting signals out", assistant: false, us: "Every draft and profile update" },
  { row: "Appraisal, CV and profile from the same record", assistant: false, us: "Whenever you need them" },
  { row: "Trains AI on what you write", assistant: "Depends on the product and settings", us: "Never" },
];

const NEVER = [
  "Posts, comments or likes anything for you",
  "Reads your LinkedIn or logs in to it",
  "Signals that you're looking for a job",
  "Sells or shares what you write",
];

const PLAN_FEATURES = [
  "A daily note that builds your private record",
  "Checked drafts and comment starters",
  "How it reads to peers, leadership and clients",
  "Profile and CV refresh, appraisal exports",
  "Weekly scorecard led by what came to you",
];

/** A quiet product preview: a checked draft with its verdict and one caught confidentiality issue. */
function DraftPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-sm">
      <div className="rounded-2xl bg-surface p-4 sm:p-5">
        <ul className="flex flex-col gap-2 text-[14px] font-medium">
          {["Safe to post", "Reads as confident, not boastful", "Sounds like you"].map((line) => (
            <li key={line} className="flex items-center gap-2">
              <CircleCheck className="size-4 text-success" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-background px-3 py-2.5 text-[13px] leading-snug text-muted">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="line-through">Acme Bank</span> → <span className="text-foreground">a large bank</span>
          </span>
        </p>
        <div className="mt-3 rounded-xl border border-border bg-background p-3.5 font-preview">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-[13px] font-semibold">PR</span>
            <div>
              <p className="text-[14px] font-semibold">Priya Rao</p>
              <p className="text-[12px] text-muted">VP Sales, healthcare</p>
            </div>
          </div>
          <p className="mt-2.5 text-[14px] leading-[1.45]">
            The pricing change that worked wasn&apos;t ours. It came from the regional team who sat with customers for two weeks.
          </p>
          <p className="mt-2 text-[14px] leading-[1.45] text-muted">Here&apos;s what I learned from letting them lead…</p>
        </div>
      </div>
    </div>
  );
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const deleted = (await searchParams).deleted === "1";

  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />

      <main className="flex flex-1 flex-col">
        {deleted && (
          <div className="mx-auto w-full max-w-5xl px-4">
            <Notice tone="success">Your account and everything in it have been deleted.</Notice>
          </div>
        )}

        <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 pt-8 pb-16 md:grid-cols-[1.1fr_1fr] md:pt-16 md:pb-24">
          <div className="flex flex-col gap-6">
            <h1 className="font-display text-display-xl font-medium text-balance">{APP_PROMISE}</h1>
            <p className="max-w-[34rem] text-lg leading-relaxed text-muted">
              Every post is checked for what your employer, clients and peers will see, and built only from your private record of
              real work. A minute a day.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/login" className={buttonClass("primary", undefined, "lg")}>
                Join the beta
                <ArrowRight aria-hidden />
              </Link>
              <Link href="/check" className={buttonClass("secondary", undefined, "lg")}>
                Check a post free
              </Link>
            </div>
            <p className="text-sm text-muted">We never touch your LinkedIn account. You approve everything.</p>
          </div>
          <DraftPreview />
        </section>

        <section className="border-t border-border bg-surface/60">
          <div className="mx-auto w-full max-w-5xl px-4 py-16 md:py-20">
            <h2 className="max-w-2xl font-display text-display-l font-medium text-balance">
              Four questions stop most people posting. Each one is answered before you post.
            </h2>
            <dl className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
              {QUESTIONS.map(({ q, a }, i) => (
                <div key={q} className="flex gap-4">
                  <span className="font-display text-display-m text-muted tabular-nums">{i + 1}</span>
                  <div>
                    <dt className="text-lg font-semibold">{q}</dt>
                    <dd className="mt-1.5 leading-relaxed text-muted">{a}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-16 md:py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {PROOFS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-2">
                <Icon aria-hidden className="size-6" strokeWidth={1.75} />
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-5xl px-4 py-16 md:py-20">
            <h2 className="font-display text-display-l font-medium">Why not just ask a general AI assistant?</h2>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
              It will write whatever you ask. It won&apos;t keep your record, know your employer&apos;s rules, or tell you how your
              leadership will read it.
            </p>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left">
                <thead>
                  <tr className="border-b border-border-strong text-sm">
                    <th className="py-3 pr-4 font-medium text-muted">
                      <span className="sr-only">Feature</span>
                    </th>
                    <th className="py-3 pr-4 font-semibold">A general AI assistant</th>
                    <th className="py-3 font-semibold">{APP_NAME}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(({ row, assistant, us }) => (
                    <tr key={row} className="border-b border-border align-top">
                      <th scope="row" className="py-3.5 pr-4 font-medium">
                        {row}
                      </th>
                      <td className="py-3.5 pr-4 text-muted">
                        {assistant || (
                          <span className="inline-flex items-center gap-1.5">
                            <Minus aria-hidden className="size-4" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-start gap-1.5">
                          <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                          {us}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted">Checks are a careful second read, not legal or compliance clearance.</p>
          </div>
        </section>

        <section className="border-t border-border bg-surface/60">
          <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
            <div>
              <h2 className="font-display text-display-l font-medium">Silence isn&apos;t modesty.</h2>
              <p className="mt-4 max-w-[34rem] text-lg leading-relaxed text-muted">
                When your work is invisible, it can&apos;t be considered — for the promotion, the board seat, the referral. {APP_NAME}{" "}
                keeps a private record of what you did and helps you share the parts worth sharing, in a way you&apos;re
                comfortable with.
              </p>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">What it never does</h3>
              <ul className="mt-4 flex flex-col divide-y divide-border border-y border-border">
                {NEVER.map((item) => (
                  <li key={item} className="flex items-center gap-3 py-3">
                    <Ban aria-hidden className="size-4 text-muted" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-4 border-t border-border">
          <div className="mx-auto w-full max-w-5xl px-4 py-16 md:py-20">
            <h2 className="font-display text-display-l font-medium">One price, everywhere</h2>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
              The same in every country, in US dollars. Local tax is added at checkout where it applies. The private beta is free.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-3 rounded-2xl border border-border p-6">
                <p className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Your first month</p>
                <p className="font-display text-display-l font-medium">
                  {formatUsd(PRICES.trial.usd)}
                  <span className="ml-1 font-sans text-base font-normal text-muted">for {TRIAL_DAYS} days</span>
                </p>
                <p className="leading-relaxed text-muted">
                  Everything in membership, with a third of the monthly allowance. Enough to build the habit and see your first
                  checked posts.
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl bg-ink p-6 text-ink-foreground">
                <p className="text-[13px] font-semibold tracking-[0.06em] uppercase opacity-80">Membership</p>
                <p className="font-display text-display-l font-medium">
                  {formatUsd(PRICES.monthly.usd)}
                  <span className="ml-1 font-sans text-base font-normal opacity-80">a month</span>
                </p>
                <p className="opacity-80">
                  or {formatUsd(PRICES.annual.usd)} a year, {annualMonthsFree() === 1 ? "one month" : `${annualMonthsFree()} months`} free
                </p>
                <ul className="mt-1 flex flex-col gap-2">
                  {PLAN_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check aria-hidden className="mt-1 size-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Every plan has a fair-use allowance that covers daily logging and an active month of drafting; you&apos;ll only hear
              about it if you get close. We email before every renewal, and you can cancel in one click.
            </p>
          </div>
        </section>

        <section className="bg-ink text-ink-foreground">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-4 py-16 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-display text-display-l font-medium">{APP_TAGLINE}</p>
              <p className="mt-2 opacity-80">Private beta for experienced professionals.</p>
            </div>
            <Link
              href="/login"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-ink-foreground px-5 font-semibold text-ink transition hover:opacity-90"
            >
              Join the beta
              <ArrowRight aria-hidden className="size-[18px]" />
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
