import Link from "next/link";
import { ArrowRight, CircleCheck, Lock, PenLine, ShieldCheck, Sparkle, Unplug } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { buttonClass } from "@/components/ui";
import { APP_NAME, APP_PROMISE, APP_TAGLINE } from "@/lib/config/app";

const QUESTIONS = [
  {
    q: "What do I post?",
    a: "Never a blank page. Your one-line daily note becomes three ways to share it: a lesson, a decision explained, or credit to your team.",
  },
  {
    q: "Will it be well received?",
    a: "Before you post, see how a peer, your leadership and a client or recruiter would likely read it. Boastful or AI-sounding lines are flagged, with a fix.",
  },
  {
    q: "Will it clash with my job, or with who I am?",
    a: "Every draft is checked against your employer rules, your never-mention list, your no-go topics and job-hunting signals. It's written in your tone.",
  },
  {
    q: "How do I even write it?",
    a: "A draft in your voice, built from your own words. One-tap edits make it shorter or more modest. You add the final line.",
  },
];

const PROOFS = [
  { icon: PenLine, title: "Only your real wins", body: "Every sentence traces back to something you logged. Nothing invented, nothing inflated." },
  { icon: ShieldCheck, title: "Checked before it leaves", body: "Client names, internal figures and job-hunting signals are caught before you see the draft." },
  { icon: Unplug, title: "Never touches your account", body: "No extension, no automation, no LinkedIn login. You copy the post and publish it yourself." },
];

const NEVER = [
  "Posts, comments or likes anything for you",
  "Reads your LinkedIn or logs in to it",
  "Signals that you're looking for a job",
  "Sells or shares what you write",
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
            <span className="line-through">Acme Bank</span> → <span className="text-foreground">a large BFSI client</span>
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

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Wordmark />
        <Link href="/login" className={buttonClass("ghost", undefined, "sm")}>
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 pt-8 pb-16 md:grid-cols-[1.1fr_1fr] md:pt-16 md:pb-24">
          <div className="flex flex-col gap-6">
            <h1 className="font-display text-display-xl font-medium text-balance">{APP_PROMISE}</h1>
            <p className="max-w-[34rem] text-lg leading-relaxed text-muted">
              Know what to post, how it will land, and that it&apos;s safe for your job — drafted in your voice from your real
              work. A minute a day.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/login" className={buttonClass("primary", undefined, "lg")}>
                Join the beta
                <ArrowRight aria-hidden />
              </Link>
              <p className="text-sm text-muted">You approve everything. We never touch your LinkedIn account.</p>
            </div>
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
                    <Sparkle aria-hidden className="size-4 text-brass" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
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

      <footer className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted">
        <Wordmark />
        <p>Your record is yours. Export or delete it at any time.</p>
      </footer>
    </div>
  );
}
