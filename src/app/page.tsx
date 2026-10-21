import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, ShieldCheck } from "lucide-react";
import { JsonLd, PublicFooter, PublicHeader } from "@/components/public-shell";
import { Notice, buttonClass } from "@/components/ui";
import { PRICES, TRIAL_DAYS, annualMonthsFree, formatUsd } from "@/lib/billing/pricing";
import { APP_NAME, APP_PROMISE } from "@/lib/config/app";
import { CONTACT, OPERATOR, SITE_DESCRIPTION, SITE_URL, absoluteUrl } from "@/lib/config/site";
import { ABOUT_WINWALL, HOME_FAQ_IDS } from "@/lib/content/site-faq";

export const metadata: Metadata = {
  title: { absolute: `${APP_NAME}: a private work record and LinkedIn post checker` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const PROMISES = [
  { title: "Never touches LinkedIn", body: "No extension, no LinkedIn login, no automation. You copy a draft and post it yourself." },
  { title: "Your words never train AI", body: "Text goes to the AI model with zero data retention: processed, not kept, never used for training." },
  { title: "Invisible at work", body: "Sign in with a personal email. No public profile, no share links, no employer dashboard." },
  { title: "Yours to take or delete", body: "Download everything, or delete your account and all of it, in one step." },
];

const FEARS = [
  { q: "Will I sound boastful?", a: "Every draft gets a “how it reads” check: credit shared, facts instead of adjectives, no humblebrag." },
  {
    q: "Could I leak something confidential?",
    a: "Client names, unreleased figures and internal project names are caught, using your own never-mention list.",
  },
  {
    q: "Will my employer think I'm job hunting?",
    a: "Phrases like “open to new challenges” or “excited for what's next” are flagged before they go out.",
  },
  { q: "Will people know I used AI?", a: "Drafts come from your notes, in your voice, and learn from your edits. Every word is yours to change." },
  { q: "What would I even post?", a: "Your record suggests three ways to share a win: a lesson, a decision, or credit to your team." },
];

const STEPS = [
  {
    title: "Note a win in a minute",
    body: "Type or say one line: “Closed the audit early; the team found the root cause.” It becomes a dated entry in your record.",
  },
  {
    title: "Ask for three ways to share it",
    body: "Drafts are built only from what you logged, in your voice, and every specific fact is checked against your record.",
  },
  {
    title: "See the checks, then post it yourself",
    body: `Edit anything, copy the post, open LinkedIn and paste. ${APP_NAME} never posts for you, and can't: it has no access.`,
  },
];

const RECORD = [
  { title: "Self-appraisal in minutes", body: "Export three, six or twelve months of wins, grouped by topic, ready for your performance review." },
  { title: "Profile and CV refresh", body: "Suggested headline, About and CV lines from your real results, each checked like a post." },
  { title: "A calm weekly look back", body: "What you did, what came your way, one suggestion for next week. No streaks, no nagging." },
];

const COMPARE: { row: string; chat: string; growth: string; us: string }[] = [
  { row: "Remembers your work over months", chat: "Only what you paste in", growth: "No", us: "Yes, a dated private record" },
  { row: "Checks for confidential details", chat: "If you remember to ask", growth: "No", us: "Every draft, with your rules" },
  { row: "Checks how it reads to colleagues", chat: "If you ask", growth: "Optimises for reach", us: "Boastful, too modest or generic" },
  { row: "Acts on your LinkedIn account", chat: "No", growth: "Often: scheduling, extensions, auto-comments", us: "Never" },
  { row: "Built for", chat: "Everything", growth: "Creators chasing followers", us: "Employed professionals who want no regrets" },
];

const DATA = [
  { what: "Your notes, wins and drafts", where: "On our own server in Mumbai, India. Each account can only ever read its own records." },
  { what: "AI drafting and checks", where: "Claude, via OpenRouter and Google Vertex AI, with zero data retention. Never used for training." },
  { what: "Backups", where: "Encrypted with AES-256 every night; kept 14 days on our server and 30 days on Google Drive." },
  { what: "Server snapshots", where: "Our host, Hostinger, also keeps weekly snapshots of the whole server, stored in Malaysia." },
  { what: "Signing in", where: "A one-time code by email. No password to leak; codes and sessions are stored only as scrambled hashes." },
  { what: "Tracking", where: "None. No ad pixels, no LinkedIn trackers, no analytics cookies. Only a sign-in cookie." },
];

const PLAN = [
  `First ${TRIAL_DAYS} days ${formatUsd(PRICES.trial.usd)}, then ${formatUsd(PRICES.monthly.usd)} a month`,
  `Or ${formatUsd(PRICES.annual.usd)} a year: ${annualMonthsFree() === 1 ? "one month" : `${annualMonthsFree()} months`} free`,
  "We email you before anything is charged",
  "Cancel in one step; keep access to the end of your period",
  "Everything included: record, drafts, checks, profile and CV refresh",
];

const display = "font-display font-medium leading-[1.12]";
const eyebrow = "text-[13px] font-semibold tracking-[0.06em] uppercase";

export default async function Home({ searchParams }: PageProps<"/">) {
  const deleted = (await searchParams).deleted === "1";
  const faqs = ABOUT_WINWALL.filter((f) => HOME_FAQ_IDS.includes(f.id));

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: APP_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon.svg"),
    description: SITE_DESCRIPTION,
    email: CONTACT.hello,
    ...(OPERATOR.legalName ? { legalName: OPERATOR.legalName } : {}),
    ...(OPERATOR.founderName ? { founder: { "@type": "Person", name: OPERATOR.founderName } } : {}),
    areaServed: ["IN", "AE", "GB", "SG", "US"],
    contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", email: CONTACT.hello }],
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: APP_NAME,
    url: absoluteUrl("/"),
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />

      <main className="flex flex-1 flex-col">
        {deleted && (
          <div className="mx-auto w-full max-w-6xl px-4 pt-4">
            <Notice tone="success">Your account and everything in it have been deleted.</Notice>
          </div>
        )}

        <section className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-12 px-4 pt-12 pb-16 md:pt-20">
          <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-6">
            <p className={`${eyebrow} text-brass`}>For managers, directors and senior specialists</p>
            <h1 className={`${display} text-[44px] text-balance md:text-[60px]`}>{APP_PROMISE}</h1>
            <p className="max-w-xl text-lg leading-relaxed text-foreground/85 md:text-xl">
              Note one thing you did each day. {APP_NAME} keeps a private record of your work, drafts LinkedIn posts only from your real
              wins, and checks every line for client names, unannounced numbers, boastful phrasing and job-hunt signals. You post it
              yourself.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/login" className={buttonClass("primary", undefined, "lg")}>
                Join the free beta
              </Link>
              <Link href="/check" className="link text-[17px] font-semibold">
                Check a post free
              </Link>
            </div>
            <p className="text-sm text-muted">Free during the beta · No card · Nothing is ever posted for you</p>
            <p className="flex items-center gap-2 text-[15px] font-medium text-success">
              <ShieldCheck aria-hidden className="size-[18px]" />
              We never touch your LinkedIn account. Private by default.
            </p>
          </div>

          <figure className="min-w-0 flex-[1_1_400px]">
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-field p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`${eyebrow} text-muted`}>Draft · lesson</span>
                <span className="rounded-full bg-success-soft px-2.5 py-1 text-[13px] font-semibold text-success">Ready to post</span>
              </div>
              <p className="leading-relaxed">
                This quarter my team moved <del className="text-danger decoration-2">Northbank&apos;s</del>{" "}
                <ins className="rounded bg-success-soft px-1 no-underline">a large retail bank&apos;s</ins> payments onto a new platform,
                two weeks ahead of plan.
              </p>
              <p className="leading-relaxed">
                What made the difference wasn&apos;t speed. We tested the riskiest step first, not last. Credit to Priya and the data
                team, who found the problem before it found us.
              </p>
              <ul className="flex flex-col gap-2.5 border-t border-border pt-4 text-[15px]">
                {[
                  ["Confidential details", "1 client name replaced"],
                  ["How it reads", "credits the team, not boastful"],
                  ["Job-hunt signals", "none"],
                  ["Sounds like you", "matches your style notes"],
                ].map(([label, value]) => (
                  <li key={label} className="flex items-start gap-2.5">
                    <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
                    <span>
                      <strong>{label}:</strong> {value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <figcaption className="mt-2.5 text-[13px] text-muted">
              An example draft screen. Built only from the person&apos;s own notes; the client name was caught before they saw it.
            </figcaption>
          </figure>
        </section>

        <section aria-labelledby="promises" className="mx-auto w-full max-w-6xl px-4 pb-16">
          <h2 id="promises" className={`${eyebrow} mb-4 text-muted`}>
            Four promises
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map((p) => (
              <div key={p.title} className="flex flex-col gap-2 rounded-2xl bg-surface p-5">
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="leading-relaxed text-foreground/80">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="fears" className="bg-surface">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 md:py-20">
            <div className="flex max-w-3xl flex-col gap-3">
              <h2 id="fears" className={`${display} text-[32px] md:text-[40px]`}>
                The five worries that keep good people quiet, answered
              </h2>
              <p className="text-lg leading-relaxed text-foreground/80">
                Most experienced professionals do work worth talking about and say nothing, because one wrong line costs more than
                silence. {APP_NAME} checks for each of these before you see a draft.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {FEARS.map((f) => (
                <div key={f.q} className="flex flex-col gap-2 rounded-2xl bg-background p-6">
                  <h3 className="text-[19px] font-semibold">&ldquo;{f.q}&rdquo;</h3>
                  <p className="leading-relaxed text-foreground/80">{f.a}</p>
                </div>
              ))}
              <div className="flex flex-col justify-between gap-3 rounded-2xl bg-ink p-6 text-ink-foreground">
                <p className="font-display text-[22px] leading-snug">You approve everything. Nothing is posted, sent or shared without you.</p>
                <Link href="/how-it-works" className="font-semibold underline underline-offset-4">
                  See how it works
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="how" className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 md:py-20">
          <h2 id="how" className={`${display} text-[32px] md:text-[40px]`}>
            How it works
          </h2>
          <ol className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-2.5">
                <span className="font-display text-4xl text-brass">{i + 1}</span>
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="leading-relaxed text-foreground/80">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="check" className="mx-auto w-full max-w-6xl px-4 pb-16 md:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-8 rounded-3xl bg-ink p-8 text-ink-foreground md:p-12">
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
              <h2 id="check" className={`${display} text-[30px] md:text-[36px]`}>
                Is it OK to post this? Check it free.
              </h2>
              <p className="text-lg leading-relaxed opacity-85">
                Paste any LinkedIn draft and see what could get you in trouble at work. No sign-up. The free check runs in your browser:
                nothing you paste is sent to us or stored.
              </p>
            </div>
            <Link
              href="/check"
              className="inline-flex min-h-[52px] items-center rounded-xl bg-ink-foreground px-6 text-[17px] font-semibold text-ink transition hover:opacity-90"
            >
              Check a post free
            </Link>
          </div>
        </section>

        <section aria-labelledby="example" className="bg-surface">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 py-16 md:py-20">
            <h2 id="example" className={`${display} text-[32px] md:text-[40px]`}>
              What the check catches
            </h2>
            <div className="flex flex-wrap gap-5">
              <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5 rounded-2xl bg-background p-6">
                <p className={`${eyebrow} text-danger`}>Before</p>
                <p className="text-[17px] leading-relaxed">
                  Thrilled to share that we just finished <mark className="bg-danger-soft px-1 text-foreground">Northbank&apos;s</mark>{" "}
                  platform migration,{" "}
                  <mark className="bg-danger-soft px-1 text-foreground">$2.1M under budget, ahead of next week&apos;s announcement</mark>!
                  Proud of what I built here. <mark className="bg-danger-soft px-1 text-foreground">Open to new challenges</mark> as I
                  look ahead.
                </p>
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-foreground/80">
                  <li>
                    Client name: <strong>Northbank</strong>
                  </li>
                  <li>An unannounced figure</li>
                  <li>Reads as a job hunt, and &ldquo;I built&rdquo; takes the team&apos;s credit</li>
                </ul>
              </div>
              <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5 rounded-2xl bg-background p-6">
                <p className={`${eyebrow} text-success`}>After</p>
                <p className="text-[17px] leading-relaxed">
                  This quarter my team moved a large retail bank onto a new platform, ahead of plan and under budget. The lesson I&apos;d
                  pass on: test the riskiest step first, not last. Credit to Priya and the data team, who found the problem before it found
                  us.
                </p>
                <p className="text-[15px] text-foreground/80">
                  Same win. Nothing you&apos;d regret if your CEO, your client or your next employer read it.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="record" className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 py-16 md:py-20">
          <div className="flex max-w-3xl flex-col gap-3">
            <h2 id="record" className={`${display} text-[32px] md:text-[40px]`}>
              Worth it even in weeks you don&apos;t post
            </h2>
            <p className="text-lg leading-relaxed text-foreground/80">
              Your record builds itself from your daily notes, so the work you did in March is still there in December.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {RECORD.map((r) => (
              <div key={r.title} className="flex flex-col gap-2 rounded-2xl border border-border p-6">
                <h3 className="text-[19px] font-semibold">{r.title}</h3>
                <p className="leading-relaxed text-foreground/80">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="compare" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 md:pb-20">
          <h2 id="compare" className={`${display} text-[32px] md:text-[40px]`}>
            Why not just use ChatGPT, or a LinkedIn growth tool?
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="bg-surface">
                <tr>
                  <th scope="col" className="w-1/3 px-5 py-4">
                    <span className="sr-only">Feature</span>
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    A general AI chat
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    LinkedIn growth tools
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold text-accent">
                    {APP_NAME}
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((c) => (
                  <tr key={c.row} className="border-t border-border">
                    <th scope="row" className="px-5 py-3.5 font-medium">
                      {c.row}
                    </th>
                    <td className="px-5 py-3.5 text-foreground/80">{c.chat}</td>
                    <td className="px-5 py-3.5 text-foreground/80">{c.growth}</td>
                    <td className="px-5 py-3.5 font-semibold">{c.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="proof" className="bg-surface">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-6 px-4 py-16 md:py-20">
            <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-3.5">
              <h2 id="proof" className={`${display} text-[30px] md:text-[36px]`}>
                How we know the check works
              </h2>
              <p className="text-lg leading-relaxed text-foreground/85">
                We wrote 46 test posts that each hide a risk: a client name, an unreleased figure, a hint of job hunting. The check caught
                all 46. On 14 clean posts it raised one gentle note.
              </p>
              <p className="text-[15px] text-muted">
                The test posts are fictional and the sample is small. We run every change against them before it ships.
              </p>
              <Link href="/how-it-works" className="link self-start font-semibold">
                What we check, in full
              </Link>
            </div>
            <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-3 rounded-2xl bg-background p-6">
              <p className="font-display text-xl leading-snug">
                Built by {OPERATOR.founderName ?? "an independent founder"}
                {OPERATOR.city ? ` in ${OPERATOR.city}, India` : " in India"}, for people who&apos;d rather say nothing than say the wrong
                thing.
              </p>
              <p className="text-[15px] text-muted">
                No investors to please and no ads to sell. You pay us; nobody else does.{" "}
                <Link href="/about" className="link">
                  About {APP_NAME}
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="data" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-16 md:py-20">
          <h2 id="data" className={`${display} text-[32px] md:text-[40px]`}>
            Where your data lives
          </h2>
          <dl className="grid gap-x-8 md:grid-cols-2">
            {DATA.map((d) => (
              <div key={d.what} className="border-t border-border py-4">
                <dt className="font-semibold">{d.what}</dt>
                <dd className="mt-1 leading-relaxed text-foreground/80">{d.where}</dd>
              </div>
            ))}
          </dl>
          <Link href="/security" className="link self-start font-semibold">
            Full security details
          </Link>
        </section>

        <section id="pricing" aria-labelledby="pricing-title" className="mx-auto w-full max-w-6xl scroll-mt-4 px-4 pb-16 md:pb-20">
          <div className="flex flex-wrap items-stretch gap-6">
            <div className="flex min-w-0 flex-[1_1_380px] flex-col justify-center gap-3">
              <h2 id="pricing-title" className={`${display} text-[32px] md:text-[40px]`}>
                One plan, one price, everywhere
              </h2>
              <p className="text-lg leading-relaxed text-foreground/80">
                Free during the private beta. After that, the same price in every country, in US dollars.
              </p>
            </div>
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4 rounded-3xl border-2 border-ink p-8">
              <p className="flex items-baseline gap-2">
                <span className="font-display text-[56px] leading-none font-medium">{formatUsd(PRICES.monthly.usd)}</span>
                <span className="text-foreground/80">a month after the beta</span>
              </p>
              <ul className="flex flex-col gap-2">
                {PLAN.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted">
                Prices exclude local tax, which is shown at checkout before you pay. Payments by Paddle; card details never reach us.
              </p>
              <Link href="/login" className={buttonClass("primary", "w-full", "lg")}>
                Join the free beta
              </Link>
            </div>
          </div>
        </section>

        <section id="faq" aria-labelledby="faq-title" className="bg-surface">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-16 md:py-20">
            <h2 id="faq-title" className={`${display} mb-2 text-[32px] md:text-[40px]`}>
              Questions people ask first
            </h2>
            {faqs.map((f, i) => (
              <details key={f.id} open={i === 0} className="group rounded-2xl bg-background px-5 py-4">
                <summary className="flex min-h-7 cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {f.q}
                  <span aria-hidden className="text-muted transition group-open:rotate-90">
                    ›
                  </span>
                </summary>
                <p className="mt-2.5 leading-relaxed text-foreground/80">{f.a}</p>
              </details>
            ))}
            <Link href="/faq" className="link mt-2 self-start font-semibold">
              More questions and answers
            </Link>
          </div>
        </section>

        <section aria-labelledby="join" className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 py-20 text-center md:py-24">
          <h2 id="join" className={`${display} text-[34px] text-balance md:text-[44px]`}>
            Your work is worth remembering. Start the record today.
          </h2>
          <Link href="/login" className={buttonClass("primary", undefined, "lg")}>
            Join the free beta
          </Link>
          <p className="text-sm text-muted">Free during the beta · No card · Nothing is ever posted for you</p>
        </section>
      </main>

      <PublicFooter />
      <JsonLd data={[organization, website]} />
    </div>
  );
}
