import type { Metadata } from "next";
import Link from "next/link";
import { Check, ChevronDown, CircleCheck, Download, EyeOff, Minus, ShieldCheck, Unplug } from "lucide-react";
import { ClosingCta, JsonLd, PublicFooter, PublicHeader, SectionHeading, container } from "@/components/public-shell";
import { MobileCtaBar } from "@/components/site/effects";
import { CopyScreen, DataFlow, DraftCheckScreen, DraftsScreen, NoteScreen, RecordScreen } from "@/components/site/graphics";
import { cx } from "@/components/ui";
import { PRICES, TRIAL_DAYS, annualMonthsFree, formatUsd } from "@/lib/billing/pricing";
import { APP_NAME, APP_PROMISE } from "@/lib/config/app";
import { CONTACT, OPERATOR, SITE_DESCRIPTION, SITE_URL, absoluteUrl } from "@/lib/config/site";
import { ABOUT_WINWALL, HOME_FAQ_IDS } from "@/lib/content/site-faq";
import { PostChecker } from "./check/checker";

export const metadata: Metadata = {
  title: { absolute: `${APP_NAME}: a private work record and LinkedIn post checker` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const PROMISES = [
  {
    icon: Unplug,
    title: "Never touches LinkedIn",
    body: "No extension, no LinkedIn login, no automation. You copy a draft and post it yourself.",
  },
  {
    icon: ShieldCheck,
    title: "Your words never train AI",
    body: "Text goes to the AI model with zero data retention: processed, not kept, never used for training.",
  },
  {
    icon: EyeOff,
    title: "Invisible at work",
    body: "Sign in with a personal email. No public profile, no share links, no employer dashboard.",
  },
  {
    icon: Download,
    title: "Yours to take or delete",
    body: "Download everything, or delete your account and all of it, in one step.",
  },
];

const FEARS = [
  {
    q: "Will I sound boastful?",
    a: "Every draft gets a “how it reads” check: credit shared, facts instead of adjectives, no humblebrag.",
  },
  {
    q: "Could I leak something confidential?",
    a: "Client names, unreleased figures and internal project names are caught, using your own never-mention list.",
  },
  {
    q: "Will my employer think I'm job hunting?",
    a: "Phrases like “open to new challenges” or “excited for what's next” are flagged before they go out.",
  },
  {
    q: "Will people know I used AI?",
    a: "Drafts come from your notes, in your voice, and learn from your edits. Every word is yours to change.",
  },
  {
    q: "What would I even post?",
    a: "Your record suggests three ways to share a win: a lesson, a decision, or credit to your team.",
  },
];

const STEPS = [
  {
    title: "Note a win in a minute",
    body: "Type or say one line. It becomes a dated entry in your private record.",
    screen: NoteScreen,
  },
  {
    title: "Ask for three ways to share it",
    body: "Drafts are built only from what you logged, in your voice, and every specific fact is checked against your record.",
    screen: DraftsScreen,
  },
  {
    title: "See the checks, then post it yourself",
    body: `Edit anything, copy the post and paste it into LinkedIn. ${APP_NAME} never posts for you, and can't: it has no access.`,
    screen: CopyScreen,
  },
];

const RECORD_POINTS = [
  "Each note becomes a dated entry, grouped by month and topic, so March's work is still there in December.",
  "Praise and thanks are kept apart from results, ready for your review.",
  "Export three, six or twelve months for a self-appraisal in minutes.",
];

type Cell = { text: string; yes?: boolean };
const COMPARE: { row: string; chat: Cell; growth: Cell; us: Cell }[] = [
  {
    row: "Remembers your work over months",
    chat: { text: "Only what you paste in" },
    growth: { text: "No" },
    us: { text: "Yes, a dated private record", yes: true },
  },
  {
    row: "Checks for confidential details",
    chat: { text: "If you remember to ask" },
    growth: { text: "No" },
    us: { text: "Every draft, with your rules", yes: true },
  },
  {
    row: "Checks how it reads to colleagues",
    chat: { text: "If you ask" },
    growth: { text: "Optimises for reach" },
    us: { text: "Boastful, too modest or generic", yes: true },
  },
  {
    row: "Acts on your LinkedIn account",
    chat: { text: "No" },
    growth: { text: "Often: scheduling, extensions, auto-comments" },
    us: { text: "Never", yes: true },
  },
  {
    row: "Built for",
    chat: { text: "Everything" },
    growth: { text: "Creators chasing followers" },
    us: { text: "Employed professionals who want no regrets" },
  },
];

const DATA = [
  {
    what: "Your notes, wins and drafts",
    where: "On our own server in Mumbai, India. Each account can only ever read its own records.",
  },
  {
    what: "AI drafting and checks",
    where: "Claude, via OpenRouter and Google Vertex AI, with zero data retention. Never used for training.",
  },
  { what: "Backups", where: "Encrypted with AES-256 every night; kept 14 days on our server and 30 days on Google Drive." },
  {
    what: "Server snapshots",
    where: "Our host, Hostinger, also keeps weekly snapshots of the whole server, stored in Malaysia.",
  },
  {
    what: "Signing in",
    where: "A one-time code by email. No password to leak; codes and sessions are stored only as scrambled hashes.",
  },
  { what: "Tracking", where: "None. No ad pixels, no LinkedIn trackers, no analytics cookies. Only a sign-in cookie." },
];

const PLAN = [
  `First ${TRIAL_DAYS} days ${formatUsd(PRICES.trial.usd)}, then ${formatUsd(PRICES.monthly.usd)} a month`,
  `Or ${formatUsd(PRICES.annual.usd)} a year: ${annualMonthsFree() === 1 ? "one month" : `${annualMonthsFree()} months`} free`,
  "We email you before anything is charged",
  "Cancel in one step; keep access to the end of your period",
  "Everything included: record, drafts, checks, profile and CV refresh",
];

const SAMPLE_DRAFT =
  "Thrilled to share that we just finished the platform migration for our client Northbank, $2.1M under budget, ahead of next week's announcement! Proud of what I built here. Open to new challenges as I look ahead.";

const section = "py-20 md:py-32";

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
        {/* 1 · Hero: the promise on the left, the product on the right */}
        <section className={cx(container, "grid items-center gap-12 pt-8 pb-20 md:pt-20 md:pb-28 lg:grid-cols-12 lg:gap-8")}>
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-6 lg:pr-8">
            {deleted && (
              <p role="status" className="flex items-center gap-2.5 rounded-lg bg-success-soft px-4 py-3 text-[16px]">
                <CircleCheck aria-hidden className="size-[18px] shrink-0 text-success" />
                Your account and everything in it have been deleted.
              </p>
            )}
            <h1 className="t-display">{APP_PROMISE}</h1>
            <p className="t-lead max-w-[34rem]">
              {APP_NAME} keeps a private record of your work and turns it into LinkedIn drafts, each checked for client names,
              unannounced numbers, boastful phrasing and job-hunt signals. You post it yourself.
            </p>
            <div data-cta className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <Link href="/login" className="btn btn-primary btn-block-phone">
                Join the free beta
              </Link>
              <Link href="/check" className="btn btn-secondary btn-block-phone">
                Check a post free
              </Link>
            </div>
            <p className="t-caption">Free during the beta. No card. Nothing is ever posted for you.</p>
          </div>
          <div className="min-w-0 lg:col-span-6">
            <DraftCheckScreen />
          </div>
        </section>

        {/* 2 · Four promises, in plain lines */}
        <section aria-labelledby="promises" className="border-t border-border">
          <div className={cx(container, "py-16 md:py-20")}>
            <h2 id="promises" className="sr-only">
              Four promises
            </h2>
            <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {PROMISES.map((p) => (
                <li key={p.title} className="flex gap-3.5">
                  <p.icon aria-hidden className="mt-[3px] size-5 shrink-0" strokeWidth={1.75} />
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-[18px] leading-snug font-semibold">{p.title}</h3>
                    <p className="text-[16px] leading-relaxed text-muted">{p.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3 · The worries, answered */}
        <section aria-labelledby="fears" className="border-t border-border">
          <div className={cx(container, section)}>
            <SectionHeading
              id="fears"
              title="The five worries that keep good people quiet"
              intro={`One wrong line costs more than silence, so most experienced people say nothing. ${APP_NAME} checks for each of these before you see a draft.`}
            />
            <dl className="mt-12 border-t border-border">
              {FEARS.map((f) => (
                <div key={f.q} className="grid gap-2 border-b border-border py-6 md:grid-cols-12 md:gap-8 md:py-8">
                  <dt className="t-title md:col-span-5">&ldquo;{f.q}&rdquo;</dt>
                  <dd className="t-body measure text-muted md:col-span-7">{f.a}</dd>
                </div>
              ))}
            </dl>
            <p className="t-body mt-8">
              You approve everything. Nothing is posted, sent or shared without you.{" "}
              <Link href="/how-it-works" className="text-link">
                See how it works
              </Link>
            </p>
          </div>
        </section>

        {/* 4 · How it works: the real three steps */}
        <section aria-labelledby="how" className="border-t border-border bg-band">
          <div className={cx(container, section)}>
            <SectionHeading id="how" title="One line a day. Drafts when you want them." />
            <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex flex-col gap-5">
                  <s.screen />
                  <div className="flex flex-col gap-2 border-t border-border pt-5">
                    <p className="tnum text-[15px] font-semibold text-muted">{i + 1}</p>
                    <h3 className="t-title">{s.title}</h3>
                    <p className="t-body text-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div data-cta className="mt-12">
              <Link href="/login" className="btn btn-primary btn-block-phone">
                Join the free beta
              </Link>
            </div>
          </div>
        </section>

        {/* 5 · Try the check on a sample draft */}
        <section aria-labelledby="check" className="border-t border-border">
          <div className={cx(container, section, "grid gap-12 lg:grid-cols-12 lg:gap-8")}>
            <div className="flex flex-col gap-4 lg:col-span-5">
              <h2 id="check" className="t-h2">
                Is it OK to post this? Try the check.
              </h2>
              <p className="t-lead">
                A sample draft is already in the box. Run the check, or paste your own. It runs in your browser: nothing you paste
                is sent to us or stored.
              </p>
            </div>
            <div className="min-w-0 lg:col-span-7">
              <PostChecker sample={SAMPLE_DRAFT} />
            </div>
          </div>
        </section>

        {/* 6 · The record pays off */}
        <section aria-labelledby="record" className="border-t border-border bg-band">
          <div className={cx(container, section, "grid items-center gap-12 lg:grid-cols-12 lg:gap-8")}>
            <div className="min-w-0 lg:col-span-7">
              <RecordScreen />
            </div>
            <div className="flex flex-col gap-6 lg:col-span-5 lg:pl-8">
              <h2 id="record" className="t-h2">
                Worth it even in weeks you don&apos;t post
              </h2>
              <ul className="flex flex-col gap-5">
                {RECORD_POINTS.map((point) => (
                  <li key={point} className="t-body flex gap-3.5">
                    <span aria-hidden className="anno-dot mt-[0.6em] shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
              <p className="t-body text-muted">
                Also: profile and CV suggestions from your real results, each checked like a post, and a calm weekly look back. No
                streaks, no nagging.
              </p>
            </div>
          </div>
        </section>

        {/* 7 · Compared */}
        <section aria-labelledby="compare" className="border-t border-border">
          <div className={cx(container, section)}>
            <SectionHeading id="compare" title="Why not just use ChatGPT, or a LinkedIn growth tool?" />
            <div className="mt-12 overflow-x-auto">
              <table className="table-site min-w-[760px]">
                <thead>
                  <tr>
                    <th scope="col" className="w-[28%]">
                      <span className="sr-only">Feature</span>
                    </th>
                    <th scope="col">A general AI chat</th>
                    <th scope="col">LinkedIn growth tools</th>
                    <th scope="col" className="bg-band">
                      {APP_NAME}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((c) => (
                    <tr key={c.row}>
                      <th scope="row">{c.row}</th>
                      <td>{c.chat.text}</td>
                      <td>{c.growth.text}</td>
                      <td className="bg-band !text-foreground">
                        <span className="flex items-start gap-2 font-medium">
                          {c.us.yes ? (
                            <Check aria-hidden className="mt-1 size-4 shrink-0" strokeWidth={2.25} />
                          ) : (
                            <Minus aria-hidden className="mt-1 size-4 shrink-0 text-subtle" />
                          )}
                          {c.us.text}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 8 · Who makes it, and how the check is tested */}
        <section aria-labelledby="proof" className="border-t border-border">
          <div className={cx(container, section, "grid gap-12 lg:grid-cols-12 lg:gap-8")}>
            <div className="flex flex-col gap-5 lg:col-span-5">
              <h2 id="proof" className="t-h2">
                Who makes it, and how we test it
              </h2>
              <p className="t-body">
                Built by {OPERATOR.founderName ?? "an independent founder"}
                {OPERATOR.city ? ` in ${OPERATOR.city}, India` : " in India"}, for people who&apos;d rather say nothing than say
                the wrong thing. No investors to please and no ads to sell: you pay us, and nobody else does.
              </p>
              <Link href="/about" className="text-link t-body w-fit">
                About {APP_NAME}
              </Link>
            </div>
            <div className="flex flex-col gap-5 lg:col-span-6 lg:col-start-7">
              <p className="t-body">
                We wrote 46 test posts that each hide a risk: a client name, an unreleased figure, a hint of job hunting. The
                check caught all 46. On 14 clean posts it raised one gentle note.
              </p>
              <p className="t-body text-muted">
                The test posts are fictional and the sample is small. We run every change against them before it ships.
              </p>
              <Link href="/how-it-works" className="text-link t-body w-fit">
                What we check, in full
              </Link>
            </div>
          </div>
        </section>

        {/* 9 · Where your data lives */}
        <section aria-labelledby="data" className="border-t border-border bg-band">
          <div className={cx(container, section)}>
            <SectionHeading id="data" title="Where your data lives" intro="Plain answers, so you can check every claim." />
            <div className="mt-12">
              <DataFlow />
            </div>
            <dl className="mt-12 grid border-t border-border md:grid-cols-2 md:gap-x-12">
              {DATA.map((d) => (
                <div key={d.what} className="border-b border-border py-5">
                  <dt className="text-[17px] font-semibold">{d.what}</dt>
                  <dd className="mt-1 text-[16px] leading-relaxed text-muted">{d.where}</dd>
                </div>
              ))}
            </dl>
            <p className="t-body mt-8 flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/security" className="text-link">
                Full security details
              </Link>
              <Link href="/privacy" className="text-link">
                Privacy notice
              </Link>
            </p>
          </div>
        </section>

        {/* 10 · Pricing */}
        <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-20 border-t border-border">
          <div className={cx(container, section, "grid items-start gap-12 lg:grid-cols-12 lg:gap-8")}>
            <div className="flex flex-col gap-4 lg:col-span-5">
              <h2 id="pricing-title" className="t-h2">
                One plan, one price, everywhere
              </h2>
              <p className="t-lead">Free during the private beta. After that, the same price in every country, in US dollars.</p>
            </div>
            <div className="flex flex-col gap-6 rounded-2xl border border-border p-7 md:p-10 lg:col-span-6 lg:col-start-7">
              <p className="t-title">{APP_NAME}</p>
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="t-h1">{formatUsd(PRICES.monthly.usd)}</span>
                <span className="t-body text-muted">a month after the beta</span>
              </p>
              <ul className="flex flex-col gap-3 border-t border-border pt-6">
                {PLAN.map((item) => (
                  <li key={item} className="t-body flex items-start gap-3">
                    <Check aria-hidden className="mt-[5px] size-4 shrink-0" strokeWidth={2.25} />
                    {item}
                  </li>
                ))}
              </ul>
              <div data-cta className="flex flex-col gap-3">
                <Link href="/login" className="btn btn-primary w-full">
                  Join the free beta
                </Link>
                <p className="t-caption">
                  Prices exclude local tax, which is shown at checkout before you pay. Payments by Paddle; card details never
                  reach us.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 11 · Questions */}
        <section id="faq" aria-labelledby="faq-title" className="border-t border-border">
          <div className={cx(container, section, "grid gap-12 lg:grid-cols-12 lg:gap-8")}>
            <div className="flex flex-col gap-4 lg:col-span-5">
              <h2 id="faq-title" className="t-h2">
                Questions people ask first
              </h2>
              <Link href="/faq" className="text-link t-body w-fit">
                More questions and answers
              </Link>
            </div>
            <div className="border-t border-border lg:col-span-7">
              {faqs.map((f, i) => (
                <details key={f.id} open={i === 0} className="faq border-b border-border">
                  <summary className="flex min-h-[64px] items-center justify-between gap-6 py-4 text-[19px] leading-snug font-medium">
                    {f.q}
                    <ChevronDown aria-hidden className="faq-chevron size-5 shrink-0 text-muted" />
                  </summary>
                  <p className="t-body measure pb-6 text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 12 · Closing */}
        <ClosingCta title="Your work is worth remembering. Start the record today." />
      </main>

      <PublicFooter />
      <MobileCtaBar href="/login" label="Join the free beta" />
      <JsonLd data={[organization, website]} />
    </div>
  );
}
