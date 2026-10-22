import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleCheck,
  DatabaseBackup,
  Download,
  EyeOff,
  HardDrive,
  KeyRound,
  Minus,
  Plus,
  ScanSearch,
  Server,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Unplug,
  UserRound,
  X,
} from "lucide-react";
import {
  Accent,
  ClosingCta,
  JsonLd,
  PublicFooter,
  PromiseText,
  PublicHeader,
  SectionHeading,
  container,
} from "@/components/public-shell";
import {
  CopyPost,
  DraftChecks,
  FlaggedPhrase,
  HeroDemo,
  Marquee,
  NoteInput,
  ProfileRefresh,
  RecordTimeline,
  ReviewDoc,
  ScanDoc,
  ThreeWays,
  ToneGauge,
  Waveform,
  WeekBars,
  WinWall,
} from "@/components/site/graphics";
import { cx } from "@/components/ui";
import { PRICES, TRIAL_DAYS, annualMonthsFree, formatUsd } from "@/lib/billing/pricing";
import { APP_NAME } from "@/lib/config/app";
import { CONTACT, OPERATOR, SITE_DESCRIPTION, SITE_URL, absoluteUrl } from "@/lib/config/site";
import { ABOUT_WINWALL, HOME_FAQ_IDS } from "@/lib/content/site-faq";

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

const CAUGHT = [
  "Client names",
  "Unannounced numbers",
  "Internal project names",
  "Your never-mention list",
  "“Open to new challenges”",
  "“Excited for what's next”",
  "Humblebrag",
  "Taking the team's credit",
  "Adjectives instead of facts",
  "Too boastful",
  "Too modest",
  "Too generic",
];

const FEARS = [
  {
    q: "Will I sound boastful?",
    a: "Every draft gets a “how it reads” check: credit shared, facts instead of adjectives, no humblebrag.",
    art: ToneGauge,
  },
  {
    q: "Could I leak something confidential?",
    a: "Client names, unreleased figures and internal project names are caught, using your own never-mention list.",
    art: ScanDoc,
  },
  {
    q: "Will my employer think I'm job hunting?",
    a: "Phrases like “open to new challenges” or “excited for what's next” are flagged before they go out.",
    art: FlaggedPhrase,
  },
  {
    q: "Will people know I used AI?",
    a: "Drafts come from your notes, in your voice, and learn from your edits. Every word is yours to change.",
    art: Waveform,
  },
  {
    q: "What would I even post?",
    a: "Your record suggests three ways to share a win: a lesson, a decision, or credit to your team.",
    art: ThreeWays,
  },
];

const STEPS = [
  {
    title: "Note a win in a minute",
    body: "Type or say one line: “Closed the audit early; the team found the root cause.” It becomes a dated entry in your record.",
    art: NoteInput,
  },
  {
    title: "Ask for three ways to share it",
    body: "Drafts are built only from what you logged, in your voice, and every specific fact is checked against your record.",
    art: DraftChecks,
  },
  {
    title: "See the checks, then post it yourself",
    body: `Edit anything, copy the post, open LinkedIn and paste. ${APP_NAME} never posts for you, and can't: it has no access.`,
    art: CopyPost,
  },
];

const RECORD = [
  {
    title: "Self-appraisal in minutes",
    body: "Export three, six or twelve months of wins, grouped by topic, ready for your performance review.",
    art: ReviewDoc,
  },
  {
    title: "Profile and CV refresh",
    body: "Suggested headline, About and CV lines from your real results, each checked like a post.",
    art: ProfileRefresh,
  },
  {
    title: "A calm weekly look back",
    body: "What you did, what came your way, one suggestion for next week. No streaks, no nagging.",
    art: WeekBars,
  },
];

type Cell = { text: string; mark?: "yes" | "no" | "some" };
const COMPARE: { row: string; chat: Cell; growth: Cell; us: Cell }[] = [
  {
    row: "Remembers your work over months",
    chat: { text: "Only what you paste in", mark: "some" },
    growth: { text: "No", mark: "no" },
    us: { text: "Yes, a dated private record", mark: "yes" },
  },
  {
    row: "Checks for confidential details",
    chat: { text: "If you remember to ask", mark: "some" },
    growth: { text: "No", mark: "no" },
    us: { text: "Every draft, with your rules", mark: "yes" },
  },
  {
    row: "Checks how it reads to colleagues",
    chat: { text: "If you ask", mark: "some" },
    growth: { text: "Optimises for reach", mark: "no" },
    us: { text: "Boastful, too modest or generic", mark: "yes" },
  },
  {
    row: "Acts on your LinkedIn account",
    chat: { text: "No" },
    growth: { text: "Often: scheduling, extensions, auto-comments", mark: "no" },
    us: { text: "Never", mark: "yes" },
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
    icon: Server,
    what: "Your notes, wins and drafts",
    where: "On our own server in Mumbai, India. Each account can only ever read its own records.",
  },
  {
    icon: Sparkles,
    what: "AI drafting and checks",
    where: "Claude, via OpenRouter and Google Vertex AI, with zero data retention. Never used for training.",
  },
  {
    icon: DatabaseBackup,
    what: "Backups",
    where: "Encrypted with AES-256 every night; kept 14 days on our server and 30 days on Google Drive.",
  },
  {
    icon: HardDrive,
    what: "Server snapshots",
    where: "Our host, Hostinger, also keeps weekly snapshots of the whole server, stored in Malaysia.",
  },
  {
    icon: KeyRound,
    what: "Signing in",
    where: "A one-time code by email. No password to leak; codes and sessions are stored only as scrambled hashes.",
  },
  {
    icon: EyeOff,
    what: "Tracking",
    where: "None. No ad pixels, no LinkedIn trackers, no analytics cookies. Only a sign-in cookie.",
  },
];

const PLAN = [
  `First ${TRIAL_DAYS} days ${formatUsd(PRICES.trial.usd)}, then ${formatUsd(PRICES.monthly.usd)} a month`,
  `Or ${formatUsd(PRICES.annual.usd)} a year: ${annualMonthsFree() === 1 ? "one month" : `${annualMonthsFree()} months`} free`,
  "We email you before anything is charged",
  "Cancel in one step; keep access to the end of your period",
  "Everything included: record, drafts, checks, profile and CV refresh",
];

function Mark({ cell, strong }: { cell: Cell; strong?: boolean }) {
  const icon =
    cell.mark === "yes" ? (
      <Check aria-hidden className="mt-0.5 size-[18px] shrink-0 text-success" />
    ) : cell.mark === "no" ? (
      <X aria-hidden className="mt-0.5 size-[18px] shrink-0 text-danger" />
    ) : cell.mark === "some" ? (
      <Minus aria-hidden className="mt-0.5 size-[18px] shrink-0 text-muted" />
    ) : null;
  return (
    <span className={cx("flex items-start gap-2", strong ? "font-semibold" : "text-muted")}>
      {icon}
      {cell.text}
    </span>
  );
}

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
        {/* ---------- Hero ---------- */}
        <section className="site-dark aurora grain under-header">
          <div className="bg-grid" />
          <WinWall className="hidden lg:grid" />
          <div
            className={cx(
              container,
              "grid items-center gap-14 pt-12 pb-16 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24",
            )}
          >
            <div className="flex min-w-0 flex-col gap-7">
              {deleted && (
                <p role="status" className="glass flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[15px] text-success">
                  <CircleCheck aria-hidden className="size-5 shrink-0" />
                  Your account and everything in it have been deleted.
                </p>
              )}
              <p className="seq pill w-fit" style={{ animationDelay: "0ms" }}>
                <span className="live-dot" aria-hidden />
                For managers, directors and senior specialists
              </p>
              <h1
                className="seq font-heading text-[48px] leading-[0.98] text-balance sm:text-[60px] md:text-[78px]"
                style={{ animationDelay: "80ms" }}
              >
                <PromiseText />
              </h1>
              <p
                className="seq max-w-xl text-lg leading-relaxed text-pretty text-muted md:text-[21px]"
                style={{ animationDelay: "160ms" }}
              >
                Note one thing you did each day. {APP_NAME} keeps a private record of your work, drafts LinkedIn posts only from
                your real wins, and checks every line for client names, unannounced numbers, boastful phrasing and job-hunt
                signals. You post it yourself.
              </p>
              <div className="seq flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
                <Link href="/login" className="btn btn-gold btn-lg">
                  Join the free beta
                  <ArrowRight aria-hidden />
                </Link>
                <Link href="/check" className="btn btn-glass btn-lg">
                  <ScanSearch aria-hidden />
                  Check a post free
                </Link>
              </div>
              <ul className="seq flex flex-wrap gap-x-6 gap-y-2 text-[14.5px] text-muted" style={{ animationDelay: "320ms" }}>
                {["Free during the beta", "No card", "Nothing is ever posted for you"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check aria-hidden className="size-4 text-brass" />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="seq flex items-center gap-2 text-[15px] font-medium text-success" style={{ animationDelay: "400ms" }}>
                <ShieldCheck aria-hidden className="size-[18px]" />
                We never touch your LinkedIn account. Private by default.
              </p>
            </div>
            <HeroDemo />
          </div>

          <div className="border-t border-white/[0.06] py-7">
            <div className={cx(container, "flex flex-col gap-4 md:flex-row md:items-center md:gap-8")}>
              <p className="shrink-0 text-[13px] font-semibold tracking-[0.09em] text-muted uppercase">
                Caught before you see a draft
              </p>
              <div className="min-w-0 flex-1">
                <Marquee
                  items={CAUGHT.map((c) => (
                    <span
                      key={c}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[14px] whitespace-nowrap text-foreground/85"
                    >
                      <TriangleAlert aria-hidden className="size-3.5 text-brass" />
                      {c}
                    </span>
                  ))}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Promises ---------- */}
        <section aria-labelledby="promises" className="py-20 md:py-28">
          <div className={cx(container, "flex flex-col gap-12")}>
            <SectionHeading
              id="promises"
              eyebrow="Four promises"
              title={
                <>
                  Private by design, <Accent>not by setting</Accent>
                </>
              }
              intro="The things you'd worry about with any tool near your career, ruled out from the start."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PROMISES.map((p) => (
                <div key={p.title} data-reveal className="card card-hover spotlight flex gap-4 p-5 sm:flex-col sm:p-6">
                  <span className="icon-chip">
                    <p.icon aria-hidden />
                  </span>
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <h3 className="font-heading text-[19px] tracking-[-0.02em]">{p.title}</h3>
                    <p className="leading-relaxed text-muted">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- The five worries ---------- */}
        <section aria-labelledby="fears" className="site-dark aurora grain">
          <div className="bg-grid" />
          <div className={cx(container, "flex flex-col gap-12 py-20 md:py-28")}>
            <SectionHeading
              id="fears"
              eyebrow="Why good people stay quiet"
              title={
                <>
                  The five worries that keep good people quiet, <Accent>answered</Accent>
                </>
              }
              intro={`Most experienced professionals do work worth talking about and say nothing, because one wrong line costs more than silence. ${APP_NAME} checks for each of these before you see a draft.`}
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {FEARS.map((f) => (
                <div key={f.q} data-reveal className="card card-hover spotlight flex flex-col gap-5 p-5">
                  <f.art />
                  <div className="flex flex-col gap-2 px-1 pb-1">
                    <h3 className="font-heading text-[20px] tracking-[-0.02em]">&ldquo;{f.q}&rdquo;</h3>
                    <p className="leading-relaxed text-muted">{f.a}</p>
                  </div>
                </div>
              ))}
              <div
                data-reveal
                className="relative flex flex-col justify-between gap-8 overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-[#ffe3a0] via-[#f2b544] to-[#d98a1e] p-7 text-[#1b1204]"
              >
                <span aria-hidden className="orbit absolute -top-24 -right-24 size-64 rounded-full border border-[#1b1204]/15" />
                <span aria-hidden className="absolute -top-12 -right-12 size-40 rounded-full border border-[#1b1204]/15" />
                <p className="font-heading relative text-[26px] leading-[1.15] tracking-[-0.03em]">
                  You approve everything. Nothing is posted, sent or shared without you.
                </p>
                <Link
                  href="/how-it-works"
                  className="relative inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-[#1b1204] px-5 text-[15px] font-semibold text-[#ffe3a0] transition hover:gap-3"
                >
                  See how it works <ArrowRight aria-hidden className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section aria-labelledby="how" className="py-20 md:py-28">
          <div className={cx(container, "flex flex-col gap-14")}>
            <SectionHeading
              id="how"
              eyebrow="How it works"
              title={
                <>
                  One line a day. <Accent>Three drafts</Accent> when you want them.
                </>
              }
            />
            <div className="relative">
              <div
                aria-hidden
                className="draw-line absolute top-[22px] right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-[#f2b544] via-[#8b7dff] to-[#f2b544] md:block"
              />
              <ol className="grid gap-6 md:grid-cols-3">
                {STEPS.map((s, i) => (
                  <li key={s.title} data-reveal className="flex flex-col gap-5">
                    <span className="relative z-10 mx-auto flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-[#ffe3a0] to-[#e09a2f] text-[17px] font-bold text-[#1b1204] shadow-[0_0_30px_rgb(242_181_68/0.45)] md:mx-0 md:self-center">
                      {i + 1}
                    </span>
                    <div className="card card-hover flex flex-1 flex-col gap-5 p-5">
                      <s.art />
                      <div className="flex flex-col gap-2 px-1 pb-1">
                        <h3 className="font-heading text-[21px] tracking-[-0.02em]">{s.title}</h3>
                        <p className="leading-relaxed text-muted">{s.body}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ---------- Free check ---------- */}
        <section aria-labelledby="check" className={cx(container, "pb-20 md:pb-28")}>
          <div data-reveal="scale" className="site-dark glow-border aurora relative overflow-hidden rounded-[2rem] p-8 md:p-14">
            <div className="bg-grid" />
            <div className="flex flex-wrap items-center justify-between gap-10">
              <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
                <p className="eyebrow">
                  <ScanSearch aria-hidden className="size-4" /> Free tool · no sign-up
                </p>
                <h2 id="check" className="font-heading text-[34px] leading-[1.05] text-balance md:text-[46px]">
                  Is it OK to post this? <Accent>Check it free.</Accent>
                </h2>
                <p className="max-w-xl text-lg leading-relaxed text-muted">
                  Paste any LinkedIn draft and see what could get you in trouble at work. No sign-up. The free check runs in your
                  browser: nothing you paste is sent to us or stored.
                </p>
              </div>
              <Link href="/check" className="btn btn-gold btn-lg">
                Check a post free
                <ArrowRight aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- Before and after ---------- */}
        <section aria-labelledby="example" className="bg-surface py-20 md:py-28">
          <div className={cx(container, "flex flex-col gap-12")}>
            <SectionHeading
              id="example"
              eyebrow="Before and after"
              title={
                <>
                  What the check <Accent>catches</Accent>
                </>
              }
            />
            <div className="relative grid gap-5 lg:grid-cols-2">
              <div data-reveal className="card flex flex-col gap-4 p-7">
                <p className="flex w-fit items-center gap-2 rounded-full bg-danger-soft px-3 py-1 text-[12.5px] font-semibold tracking-[0.06em] text-danger uppercase">
                  <TriangleAlert aria-hidden className="size-3.5" /> Before
                </p>
                <p className="text-[17px] leading-relaxed">
                  Thrilled to share that we just finished{" "}
                  <mark className="rounded bg-danger-soft px-1 text-foreground underline decoration-danger decoration-wavy decoration-1 underline-offset-4">
                    Northbank&apos;s
                  </mark>{" "}
                  platform migration,{" "}
                  <mark className="rounded bg-danger-soft px-1 text-foreground underline decoration-danger decoration-wavy decoration-1 underline-offset-4">
                    $2.1M under budget, ahead of next week&apos;s announcement
                  </mark>
                  ! Proud of what I built here.{" "}
                  <mark className="rounded bg-danger-soft px-1 text-foreground underline decoration-danger decoration-wavy decoration-1 underline-offset-4">
                    Open to new challenges
                  </mark>{" "}
                  as I look ahead.
                </p>
                <ul className="flex flex-col gap-2 border-t border-[var(--card-border)] pt-4 text-[15px] text-muted">
                  <li className="flex items-start gap-2">
                    <X aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
                    <span>
                      Client name: <strong className="text-foreground">Northbank</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
                    An unannounced figure
                  </li>
                  <li className="flex items-start gap-2">
                    <X aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
                    Reads as a job hunt, and &ldquo;I built&rdquo; takes the team&apos;s credit
                  </li>
                </ul>
              </div>
              <span
                aria-hidden
                className="absolute top-1/2 left-1/2 z-10 hidden size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[#ffe3a0] to-[#e09a2f] text-[#1b1204] shadow-[0_0_40px_rgb(242_181_68/0.5)] lg:flex"
              >
                <ArrowRight className="size-6" />
              </span>
              <div data-reveal className="card flex flex-col gap-4 p-7">
                <p className="flex w-fit items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-[12.5px] font-semibold tracking-[0.06em] text-success uppercase">
                  <CircleCheck aria-hidden className="size-3.5" /> After
                </p>
                <p className="text-[17px] leading-relaxed">
                  This quarter my team moved a large retail bank onto a new platform, ahead of plan and under budget. The lesson
                  I&apos;d pass on: test the riskiest step first, not last. Credit to Priya and the data team, who found the
                  problem before it found us.
                </p>
                <p className="flex items-start gap-2 border-t border-[var(--card-border)] pt-4 text-[15px] text-muted">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                  Same win. Nothing you&apos;d regret if your CEO, your client or your next employer read it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- The record ---------- */}
        <section aria-labelledby="record" className="py-20 md:py-28">
          <div className={cx(container, "flex flex-col gap-12")}>
            <SectionHeading
              id="record"
              eyebrow="Your wall of wins"
              title={
                <>
                  Worth it even in weeks <Accent>you don&apos;t post</Accent>
                </>
              }
              intro="Your record builds itself from your daily notes, so the work you did in March is still there in December."
            />
            <div data-reveal className="card spotlight flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
              <div className="md:w-[45%]">
                <RecordTimeline />
              </div>
              <div className="flex flex-col gap-2 md:flex-1">
                <h3 className="font-heading text-[24px] tracking-[-0.02em]">A dated, private record of what you did</h3>
                <p className="leading-relaxed text-muted">
                  Every note becomes an entry you can search, group and export. When review season comes, the evidence is already
                  there.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {RECORD.map((r) => (
                <div key={r.title} data-reveal className="card card-hover spotlight flex flex-col gap-5 p-5">
                  <r.art />
                  <div className="flex flex-col gap-2 px-1 pb-1">
                    <h3 className="font-heading text-[20px] tracking-[-0.02em]">{r.title}</h3>
                    <p className="leading-relaxed text-muted">{r.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Comparison ---------- */}
        <section aria-labelledby="compare" className="pb-20 md:pb-28">
          <div className={cx(container, "flex flex-col gap-10")}>
            <SectionHeading
              id="compare"
              eyebrow="The difference"
              title={
                <>
                  Why not just use ChatGPT, or a <Accent>LinkedIn growth tool?</Accent>
                </>
              }
            />
            <div data-reveal className="card overflow-x-auto p-0">
              <table className="w-full min-w-[760px] border-collapse text-left text-[15px]">
                <thead>
                  <tr className="border-b border-[var(--card-border)]">
                    <th scope="col" className="w-[28%] px-6 py-5">
                      <span className="sr-only">Feature</span>
                    </th>
                    <th scope="col" className="px-6 py-5 font-semibold text-muted">
                      A general AI chat
                    </th>
                    <th scope="col" className="px-6 py-5 font-semibold text-muted">
                      LinkedIn growth tools
                    </th>
                    <th scope="col" className="bg-brass-soft/60 px-6 py-5">
                      <span className="flex items-center gap-2 font-semibold">
                        <span className="size-2 rounded-full bg-[#f2b544] shadow-[0_0_10px_#f2b544]" />
                        {APP_NAME}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((c) => (
                    <tr key={c.row} className="border-b border-[var(--card-border)] last:border-0">
                      <th scope="row" className="px-6 py-4 font-medium">
                        {c.row}
                      </th>
                      <td className="px-6 py-4">
                        <Mark cell={c.chat} />
                      </td>
                      <td className="px-6 py-4">
                        <Mark cell={c.growth} />
                      </td>
                      <td className="bg-brass-soft/60 px-6 py-4">
                        <Mark cell={c.us} strong />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ---------- Proof ---------- */}
        <section aria-labelledby="proof" className="site-dark aurora grain">
          <div className="bg-grid" />
          <div className={cx(container, "grid items-center gap-10 py-20 md:py-28 lg:grid-cols-[1.1fr_1fr]")}>
            <div data-reveal className="flex flex-col gap-6">
              <p className="eyebrow">Tested before it ships</p>
              <h2 id="proof" className="font-heading text-[34px] leading-[1.05] md:text-[48px]">
                How we know the check <Accent>works</Accent>
              </h2>
              <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
                <p className="flex flex-col">
                  <span className="font-heading text-gold text-[84px] leading-none tracking-[-0.05em] md:text-[110px]">
                    46/46
                  </span>
                  <span className="text-[15px] text-muted">risky test posts caught</span>
                </p>
                <p className="flex flex-col pb-2">
                  <span className="font-heading text-[44px] leading-none tracking-[-0.04em]">1 of 14</span>
                  <span className="text-[15px] text-muted">clean posts got a gentle note</span>
                </p>
              </div>
              <p className="max-w-xl text-lg leading-relaxed text-muted">
                We wrote 46 test posts that each hide a risk: a client name, an unreleased figure, a hint of job hunting. The
                check caught all 46. On 14 clean posts it raised one gentle note.
              </p>
              <p className="text-[15px] text-muted">
                The test posts are fictional and the sample is small. We run every change against them before it ships.
              </p>
              <Link href="/how-it-works" className="btn btn-glass w-fit">
                What we check, in full <ArrowRight aria-hidden />
              </Link>
            </div>
            <div data-reveal className="card spotlight flex flex-col gap-5 p-7 md:p-9">
              <span className="icon-chip">
                <UserRound aria-hidden />
              </span>
              <p className="font-heading text-[24px] leading-snug tracking-[-0.02em]">
                Built by {OPERATOR.founderName ?? "an independent founder"}
                {OPERATOR.city ? ` in ${OPERATOR.city}, India` : " in India"}, for people who&apos;d rather say nothing than say
                the wrong thing.
              </p>
              <p className="text-[15px] leading-relaxed text-muted">
                No investors to please and no ads to sell. You pay us; nobody else does.{" "}
                <Link href="/about" className="text-accent underline underline-offset-4">
                  About {APP_NAME}
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Data ---------- */}
        <section aria-labelledby="data" className="py-20 md:py-28">
          <div className={cx(container, "flex flex-col gap-12")}>
            <SectionHeading
              id="data"
              eyebrow="Security"
              title={
                <>
                  Where your data <Accent>lives</Accent>
                </>
              }
              intro="Plain answers, not a badge wall."
            />
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DATA.map((d) => (
                <div key={d.what} data-reveal className="card card-hover flex flex-col gap-3 p-6">
                  <span className="icon-chip">
                    <d.icon aria-hidden />
                  </span>
                  <dt className="font-heading text-[18px] tracking-[-0.02em]">{d.what}</dt>
                  <dd className="leading-relaxed text-muted">{d.where}</dd>
                </div>
              ))}
            </dl>
            <Link href="/security" className="btn btn-ink w-fit">
              Full security details <ArrowRight aria-hidden />
            </Link>
          </div>
        </section>

        {/* ---------- Pricing ---------- */}
        <section id="pricing" aria-labelledby="pricing-title" className="site-dark aurora grain scroll-mt-16">
          <div className="bg-grid" />
          <div className={cx(container, "grid items-center gap-12 py-20 md:py-28 lg:grid-cols-2")}>
            <div data-reveal className="flex flex-col gap-5">
              <p className="eyebrow">Pricing</p>
              <h2 id="pricing-title" className="font-heading text-[34px] leading-[1.05] md:text-[52px]">
                One plan, one price, <Accent>everywhere</Accent>
              </h2>
              <p className="max-w-lg text-lg leading-relaxed text-muted">
                Free during the private beta. After that, the same price in every country, in US dollars.
              </p>
            </div>
            <div data-reveal="scale" className="glow-border flex flex-col gap-6 rounded-[1.75rem] p-8 md:p-10">
              <div className="flex items-center justify-between gap-4">
                <p className="font-heading text-[18px]">{APP_NAME}</p>
                <span className="rounded-full bg-brass-soft px-3 py-1 text-[12.5px] font-semibold text-brass">Free in beta</span>
              </div>
              <p className="flex items-baseline gap-2">
                <span className="font-heading text-[64px] leading-none tracking-[-0.05em]">{formatUsd(PRICES.monthly.usd)}</span>
                <span className="text-muted">a month after the beta</span>
              </p>
              <ul className="flex flex-col gap-3">
                {PLAN.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success-soft">
                      <Check aria-hidden className="size-3.5 text-success" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted">
                Prices exclude local tax, which is shown at checkout before you pay. Payments by Paddle; card details never reach
                us.
              </p>
              <Link href="/login" className="btn btn-gold btn-lg w-full">
                Join the free beta
                <ArrowRight aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" aria-labelledby="faq-title" className="py-20 md:py-28">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 sm:px-6">
            <SectionHeading
              id="faq-title"
              center
              eyebrow="FAQ"
              title={
                <>
                  Questions people <Accent>ask first</Accent>
                </>
              }
            />
            <div className="flex flex-col gap-3">
              {faqs.map((f, i) => (
                <details
                  key={f.id}
                  open={i === 0}
                  data-reveal
                  className="card group px-6 py-5 open:shadow-[var(--card-shadow-hover)]"
                >
                  <summary className="flex min-h-7 cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface transition group-open:rotate-45 group-open:bg-brass-soft group-open:text-brass">
                      <Plus aria-hidden className="size-4" />
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
            <Link href="/faq" className="btn btn-glass mx-auto">
              More questions and answers <ArrowRight aria-hidden />
            </Link>
          </div>
        </section>

        <ClosingCta
          title={
            <>
              Your work is worth remembering. <Accent>Start the record today.</Accent>
            </>
          }
        />
      </main>

      <PublicFooter />
      <JsonLd data={[organization, website]} />
    </div>
  );
}
