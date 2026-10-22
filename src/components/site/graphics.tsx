import type { CSSProperties, ReactNode } from "react";
import { Award, CircleCheck, Copy, FileText, Flag, Medal, Mic, ShieldCheck, Sparkles, Star, Trophy, Users } from "lucide-react";
import { cx } from "../ui";

// Decorative pictures for the public site, drawn with HTML, SVG and CSS so they stay crisp, light
// and readable without JavaScript. Animations live in src/app/(site)/site.css.

/** Delay for a step in a CSS sequence. */
export const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
const index = (i: number) => ({ "--i": i }) as CSSProperties;

/** Text that appears word by word. The words stay real text in the HTML. */
export function Words({ text, start = 0 }: { text: string; start?: number }) {
  const words = text.split(" ");
  return (
    <span className="words" style={delay(start)}>
      {words.map((word, i) => (
        <span key={i} style={index(i)}>
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

function Tick({ at, className }: { at: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cx("tick size-5 shrink-0 text-success", className)} style={delay(at)}>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.16" />
      <path
        d="M7.2 12.4l3.1 3.1 6.5-6.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CHECKS: [string, string][] = [
  ["Confidential details", "1 client name replaced"],
  ["How it reads", "credits the team, not boastful"],
  ["Job-hunt signals", "none"],
  ["Sounds like you", "matches your style notes"],
];

/**
 * The hero picture: a note becomes a draft, the client name is caught and replaced, the four
 * checks tick, and the draft is ready to post. Plays once, then rests on the finished state.
 */
export function HeroDemo() {
  return (
    <figure className="min-w-0">
      <div className="relative">
        <div className="glass card overflow-hidden rounded-[24px] shadow-[0_50px_140px_-50px_rgb(124_108_255/0.65)]">
          <div className="flex h-11 items-center gap-2 border-b border-white/10 px-4">
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="mx-auto pr-10 text-[12.5px] text-muted">Winwall · Today</span>
          </div>
          <div className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="seq flex items-start gap-3" style={delay(150)}>
              <span className="icon-chip size-9 rounded-xl">
                <Mic aria-hidden className="!size-[18px]" />
              </span>
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.05] px-4 py-3">
                <p className="mb-1 text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">Today&apos;s note</p>
                <p className="text-[14.5px] leading-relaxed">
                  <Words text="Closed the Northbank migration two weeks early. Priya's team found the root cause." start={400} />
                </p>
              </div>
            </div>

            <div className="seq flex items-center gap-2 pl-12 text-[12.5px] text-muted" style={delay(1300)}>
              <Sparkles aria-hidden className="size-3.5 text-brass" />
              Drafted only from your record
            </div>

            <div className="seq rounded-2xl border border-white/10 bg-white/[0.04] p-4" style={delay(1700)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">Draft · lesson</span>
                <span
                  className="badge-ready flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[12px] font-semibold text-success"
                  style={delay(4300)}
                >
                  <CircleCheck aria-hidden className="size-3.5" />
                  Ready to post
                </span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed">
                This quarter my team moved{" "}
                <span className="strike" style={delay(2500)}>
                  Northbank&apos;s
                </span>{" "}
                <span className="swap-in rounded-md bg-success-soft px-1 text-success" style={delay(2900)}>
                  a large retail bank&apos;s
                </span>{" "}
                payments onto a new platform, two weeks ahead of plan.
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-foreground/80">
                What made the difference: we tested the riskiest step first, not last. Credit to Priya and the data team.
              </p>
              <ul className="mt-4 grid gap-2.5 border-t border-white/10 pt-4 text-[13.5px] sm:grid-cols-2">
                {CHECKS.map(([label, value], i) => (
                  <li key={label} className="seq flex items-start gap-2" style={delay(3200 + i * 280)}>
                    <Tick at={3300 + i * 280} />
                    <span>
                      <strong className="font-semibold">{label}:</strong> <span className="text-muted">{value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="float-a glass absolute -top-5 right-8 hidden items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium shadow-xl shadow-black/40 xl:flex"
        >
          <ShieldCheck className="size-4 text-success" /> Client name caught
        </div>
        <div
          aria-hidden
          className="float-b glass absolute -bottom-5 left-10 hidden items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium shadow-xl shadow-black/40 xl:flex"
        >
          <Sparkles className="size-4 text-brass" /> Sounds like you
        </div>
      </div>

      <figcaption className="mt-4 text-[13px] leading-relaxed text-muted xl:mt-12">
        An example draft screen. Built only from the person&apos;s own notes; the client name was caught before they saw it.
      </figcaption>
    </figure>
  );
}

const WALL: [typeof Trophy, string, string][][] = [
  [
    [Trophy, "Closed the audit two weeks early", "Mar 12"],
    [Users, "Mentored two new analysts", "Apr 3"],
    [Star, "Client renewal signed", "Apr 19"],
    [Award, "Report time cut from 3 days to 1", "May 7"],
  ],
  [
    [Medal, "Led the vendor migration", "Jan 22"],
    [Sparkles, "Spoke at the leadership offsite", "Feb 9"],
    [Trophy, "Hired a team of four", "Mar 1"],
    [Star, "Fixed the month-end bottleneck", "Mar 28"],
  ],
  [
    [Award, "Launched the pricing pilot", "Jun 2"],
    [Users, "Ran the cross-team retro", "Jun 16"],
    [Medal, "Quarter closed under budget", "Jul 1"],
    [Sparkles, "Wrote the onboarding guide", "Jul 14"],
  ],
  [
    [Star, "Shipped v2 ahead of plan", "Aug 5"],
    [Trophy, "Internal innovation award", "Aug 21"],
    [Award, "Escalation resolved in a day", "Sep 3"],
    [Users, "Coached the new team lead", "Sep 18"],
  ],
];

/** The wall of wins: framed achievements drifting behind the hero. Decorative only. */
export function WinWall({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cx("wall", className)}>
      {WALL.map((column, c) => (
        <div key={c} className="wall-col">
          {[...column, ...column].map(([Icon, text, date], i) => (
            <div key={i} className="wall-tile">
              <div className="flex items-center justify-between">
                <Icon />
                <span className="text-[11px] text-white/40">{date}</span>
              </div>
              {text}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** An endless, pausable strip of chips. The second copy is hidden from screen readers. */
export function Marquee({ items }: { items: ReactNode[] }) {
  return (
    <div className="marquee">
      <div className="marquee-track">
        <ul className="m-0 list-none p-0">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <ul aria-hidden className="m-0 list-none p-0">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- Small illustrations for feature cards ---------- */

const frame =
  "relative flex h-36 items-center justify-center overflow-hidden rounded-2xl border border-[var(--card-border)] bg-surface";

/** A "how it reads" gauge settling on "just right". */
export function ToneGauge() {
  return (
    <div aria-hidden className={frame}>
      <div className="flex w-[78%] flex-col gap-2.5">
        <div className="relative h-2.5 rounded-full bg-gradient-to-r from-sky-400/60 via-emerald-400/80 to-rose-400/70">
          <span className="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-emerald-500 shadow-lg" />
        </div>
        <div className="flex justify-between text-[11px] font-medium text-muted">
          <span>Too modest</span>
          <span className="text-success">Just right</span>
          <span>Boastful</span>
        </div>
      </div>
    </div>
  );
}

/** Lines of a draft being scanned, with a confidential name blacked out. */
export function ScanDoc() {
  return (
    <div aria-hidden className={cx(frame, "scan")}>
      <div className="flex w-[78%] flex-col gap-2">
        <span className="h-2 w-full rounded-full bg-foreground/15" />
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-1/4 rounded-full bg-foreground/15" />
          <span className="h-3.5 w-1/3 rounded bg-foreground/80" />
          <span className="h-2 w-1/4 rounded-full bg-foreground/15" />
        </span>
        <span className="h-2 w-5/6 rounded-full bg-foreground/15" />
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2/5 rounded-full bg-foreground/15" />
          <span className="h-3.5 w-1/5 rounded bg-foreground/80" />
        </span>
        <span className="h-2 w-2/3 rounded-full bg-foreground/15" />
      </div>
    </div>
  );
}

/** A job-hunt phrase, flagged. */
export function FlaggedPhrase() {
  return (
    <div aria-hidden className={frame}>
      <div className="flex flex-col items-center gap-3">
        <span className="rounded-full border border-danger/30 bg-danger-soft px-3.5 py-1.5 text-[13px] font-medium text-danger line-through decoration-2">
          open to new challenges
        </span>
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
          <Flag className="size-3.5 text-danger" /> Reads as a job hunt
        </span>
      </div>
    </div>
  );
}

/** A voice waveform: drafts in your own words. */
export function Waveform() {
  return (
    <div aria-hidden className={frame}>
      <div className="wave flex h-14 items-end gap-1.5">
        {[0.5, 0.8, 0.4, 1, 0.65, 0.9, 0.45, 0.75, 0.55, 0.95, 0.4, 0.7, 0.5].map((h, i) => (
          <span key={i} style={{ ...index(i), height: `${h * 100}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Three ways to share a win, with one chosen. */
export function ThreeWays() {
  return (
    <div aria-hidden className={frame}>
      <div className="flex items-end gap-2.5">
        {["Lesson", "Decision", "Credit"].map((label, i) => (
          <div
            key={label}
            className={cx(
              "flex w-[84px] flex-col gap-1.5 rounded-xl border bg-[var(--field)] p-2.5 shadow-md transition",
              i === 1
                ? "-translate-y-3 border-[#f2b544] shadow-[0_10px_30px_-10px_rgb(242_181_68/0.6)]"
                : "border-[var(--card-border)]",
            )}
          >
            <span
              className={cx("text-[10.5px] font-semibold tracking-[0.06em] uppercase", i === 1 ? "text-brass" : "text-muted")}
            >
              {label}
            </span>
            <span className="h-1.5 w-full rounded-full bg-foreground/15" />
            <span className="h-1.5 w-3/4 rounded-full bg-foreground/15" />
            <span className="h-1.5 w-5/6 rounded-full bg-foreground/15" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A draft with its checks passed. */
export function DraftChecks() {
  return (
    <div aria-hidden className={frame}>
      <div className="flex w-52 flex-col gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--field)] p-3 shadow-lg">
        <span className="h-1.5 w-full rounded-full bg-foreground/15" />
        <span className="h-1.5 w-4/5 rounded-full bg-foreground/15" />
        <div className="mt-1 flex flex-col gap-1.5 border-t border-[var(--card-border)] pt-2">
          {["Facts match your record", "No confidential details", "Reads well"].map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
              <CircleCheck className="size-3.5 text-success" /> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A dated record growing over the months: the wall of wins filling up. */
export function RecordTimeline() {
  const months: [string, number][] = [
    ["Jan", 1],
    ["Mar", 2],
    ["Jun", 3],
    ["Sep", 3],
    ["Dec", 4],
  ];
  return (
    <div aria-hidden className={cx(frame, "h-44")}>
      <div className="relative flex w-[82%] items-end justify-between">
        <span className="absolute inset-x-0 bottom-[30px] h-px bg-gradient-to-r from-transparent via-foreground/25 to-transparent" />
        {months.map(([m, count], i) => (
          <span key={m} className="relative flex flex-col items-center gap-2">
            <span className="flex flex-col-reverse gap-1">
              {Array.from({ length: count }, (_, t) => (
                <span
                  key={t}
                  className={cx(
                    "bar-grow h-3 w-8 rounded-[4px]",
                    i === months.length - 1 && t === count - 1
                      ? "bg-gradient-to-r from-[#ffd98a] to-[#e09a2f] shadow-[0_0_14px_rgb(242_181_68/0.6)]"
                      : "bg-foreground/15",
                  )}
                  style={index(i + t)}
                />
              ))}
            </span>
            <span
              className={cx(
                "size-3 rounded-full border-2",
                i === months.length - 1
                  ? "border-[#f2b544] bg-[#f2b544] shadow-[0_0_14px_#f2b544]"
                  : "border-foreground/40 bg-[var(--field)]",
              )}
            />
            <span className="text-[11px] font-medium text-muted">{m}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** A review document assembling itself. */
export function ReviewDoc() {
  return (
    <div aria-hidden className={frame}>
      <div className="relative">
        <div className="absolute top-2 left-3 h-28 w-40 rotate-6 rounded-xl border border-[var(--card-border)] bg-[var(--field)] opacity-60" />
        <div className="relative flex h-28 w-40 flex-col gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--field)] p-3 shadow-lg">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold">
            <FileText className="size-3.5 text-brass" /> H1 review
          </span>
          {[0.9, 0.7, 0.8, 0.55].map((w, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#f2b544]" />
              <span className="h-1.5 rounded-full bg-foreground/15" style={{ width: `${w * 100}%` }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A profile headline being refreshed. */
export function ProfileRefresh() {
  return (
    <div aria-hidden className={frame}>
      <div className="flex w-52 items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--field)] p-3 shadow-lg">
        <span className="size-10 shrink-0 rounded-full bg-gradient-to-br from-[#8b7dff] to-[#f2b544]" />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="h-2 w-3/4 rounded-full bg-foreground/30" />
          <span className="h-1.5 w-full rounded-full bg-[#f2b544]/70" />
          <span className="h-1.5 w-2/3 rounded-full bg-foreground/15" />
        </span>
      </div>
      <span className="absolute top-5 right-6 rounded-full bg-brass-soft px-2 py-0.5 text-[11px] font-semibold text-brass">
        Suggested
      </span>
    </div>
  );
}

/** A quiet week in bars. No streaks. */
export function WeekBars() {
  return (
    <div aria-hidden className={frame}>
      <div className="flex h-20 items-end gap-2.5">
        {[0.45, 0.7, 0.35, 0.85, 0.6, 0.2, 0.15].map((h, i) => (
          <span key={i} className="flex flex-col items-center gap-1.5">
            <span
              className={cx(
                "bar-grow w-5 rounded-md",
                i === 3 ? "bg-gradient-to-t from-[#e09a2f] to-[#ffd98a]" : "bg-foreground/20",
              )}
              style={{ ...index(i), height: `${h * 64}px` }}
            />
            <span className="text-[10px] text-muted">{"MTWTFSS"[i]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** The last step: copy the post and paste it yourself. */
export function CopyPost() {
  return (
    <div aria-hidden className={frame}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-semibold text-ink-foreground shadow-lg">
          <Copy className="size-4" /> Copy post
        </span>
        <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-success">
          <CircleCheck className="size-4" /> Copied
        </span>
      </div>
    </div>
  );
}

/** Typing a one-line note, with the voice option. */
export function NoteInput() {
  return (
    <div aria-hidden className={frame}>
      <div className="flex w-[82%] items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--field)] p-2 pl-3 shadow-md">
        <span className="caret min-w-0 flex-1 truncate text-[13px] text-foreground/80">Closed the audit early; the team</span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#ffd98a] to-[#e09a2f] text-[#1b1204]">
          <Mic className="size-4" />
        </span>
      </div>
    </div>
  );
}
