import type { ReactNode } from "react";
import { ArrowRight, CircleCheck, Copy, ExternalLink, Mic, OctagonAlert, TriangleAlert } from "lucide-react";
import { cx } from "../ui";

// Product pictures for the public site: crops of Winwall's own screens, rebuilt in HTML with the
// app's tokens so they stay sharp, readable and true to the product. Fictional content only.
// No browser chrome, device frames, tilt, glow or shadow (docs/DESIGN.md).

type Status = "risk" | "check" | "clear";

const STATUS: Record<Status, { icon: typeof OctagonAlert; word: string; colour: string }> = {
  risk: { icon: OctagonAlert, word: "Risk", colour: "text-danger" },
  check: { icon: TriangleAlert, word: "Check", colour: "text-caution" },
  clear: { icon: CircleCheck, word: "Clear", colour: "text-success" },
};

/** One line of the checker's verdict: the shape and the word carry the meaning, colour only helps. */
export function StatusLine({ status, children }: { status: Status; children: ReactNode }) {
  const { icon: Icon, word, colour } = STATUS[status];
  return (
    <li className="flex items-start gap-2.5">
      <Icon aria-hidden className={cx("mt-[3px] size-[17px] shrink-0", colour)} strokeWidth={2} />
      <span>
        <strong className="font-semibold">{word}.</strong> <span className="text-muted">{children}</span>
      </span>
    </li>
  );
}

/** A screen crop on its stage. */
export function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("stage", className)}>{children}</div>;
}

/** The hero picture: a draft as Winwall shows it, with one risk, one thing to check and the rest clear. */
export function DraftCheckScreen() {
  return (
    <figure className="flex min-w-0 flex-col gap-3">
      <Stage>
        <div className="screen p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[14px] font-medium text-subtle">Draft · a lesson</p>
            <p className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-[13.5px] font-medium">
              <OctagonAlert aria-hidden className="size-3.5 text-danger" strokeWidth={2.25} />1 thing to fix
            </p>
          </div>
          <p className="mt-4 text-[16px] leading-[1.6]">
            Thrilled to share that my team moved <span className="mark-risk">Northbank&apos;s</span> payments onto a new platform,
            two weeks ahead of plan. <span className="mark-check">Proud of what I built here.</span> The lesson: test the riskiest
            step first, not last.
          </p>
          <ul className="mt-5 flex flex-col gap-3 border-t border-border pt-4 text-[14.5px] leading-snug">
            <StatusLine status="risk">A client&apos;s name. Try &ldquo;a large retail bank&rdquo;.</StatusLine>
            <StatusLine status="check">&ldquo;What I built&rdquo; may read as taking your team&apos;s credit.</StatusLine>
            <StatusLine status="clear">No job-hunt signals. Every fact matches your record.</StatusLine>
          </ul>
        </div>
      </Stage>
      <figcaption className="t-caption max-w-[34rem]">
        An example draft screen, from fictional notes. The client&apos;s name is caught before anyone sees it.
      </figcaption>
    </figure>
  );
}

/** Step 1: a one-line note. */
export function NoteScreen() {
  return (
    <Stage className="!p-4 md:!p-5">
      <div className="screen flex flex-col gap-3 p-4">
        <p className="text-[13.5px] font-medium text-subtle">Today · Thursday</p>
        <p className="min-h-[3.2em] rounded-lg border border-border-strong px-3 py-2 text-[15px] leading-snug">
          Closed the audit early; the team found the root cause.
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[13.5px] text-muted">
            <Mic aria-hidden className="size-4" /> Say it instead
          </span>
          <span className="rounded-md bg-ink px-3 py-1.5 text-[13.5px] font-medium text-ink-foreground">Save note</span>
        </div>
      </div>
    </Stage>
  );
}

/** Step 2: three drafts from the same win. */
export function DraftsScreen() {
  return (
    <Stage className="!p-4 md:!p-5">
      <div className="screen flex flex-col gap-3 p-4">
        <div className="grid grid-cols-3 rounded-lg bg-surface p-1 text-center text-[13.5px] font-medium">
          <span className="rounded-md bg-background py-1 shadow-[0_0_0_1px_var(--border)]">Lesson</span>
          <span className="py-1 text-muted">Decision</span>
          <span className="py-1 text-muted">Credit</span>
        </div>
        <p className="text-[15px] leading-snug">The audit closed early because we went after the root cause, not the symptoms.</p>
        <p className="text-[13.5px] text-subtle">Based on 2 wins from your record</p>
      </div>
    </Stage>
  );
}

/** Step 3: checks passed; copy it and post it yourself. */
export function CopyScreen() {
  return (
    <Stage className="!p-4 md:!p-5">
      <div className="screen flex flex-col gap-3 p-4">
        <p className="flex items-center gap-2 text-[14.5px]">
          <CircleCheck aria-hidden className="size-[17px] text-success" strokeWidth={2} />
          <span>
            <strong className="font-semibold">Clear.</strong> <span className="text-muted">4 checks passed</span>
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-[13.5px] font-medium text-ink-foreground">
            <Copy aria-hidden className="size-3.5" /> Copy post
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-border-soft px-3 py-1.5 text-[13.5px] font-medium">
            Open LinkedIn <ExternalLink aria-hidden className="size-3.5" />
          </span>
        </div>
        <p className="text-[13.5px] text-subtle">You paste and post. Winwall has no access to LinkedIn.</p>
      </div>
    </Stage>
  );
}

const RECORD: [string, string, string][] = [
  ["14 Oct", "Closed the vendor audit two weeks early", "Result"],
  ["9 Oct", "Priya's team thanked us for the handover notes", "Praise"],
  ["2 Oct", "Chose to phase the migration; zero downtime", "Decision"],
  ["26 Sep", "Mentored two new analysts through month-end", "Team"],
];

/** The record: dated entries, with three annotations matched to the points beside it. */
export function RecordScreen() {
  return (
    <Stage>
      <div className="screen overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <p className="text-[15px] font-semibold">Your record</p>
          <p className="relative text-[13.5px] font-medium text-muted">
            Export
            <span aria-hidden className="anno-dot absolute top-1/2 -right-4 -translate-y-1/2" />
          </p>
        </div>
        <p className="relative px-5 pt-4 pb-1 text-[13.5px] font-medium text-subtle">
          October · 3 wins
          <span aria-hidden className="anno-dot absolute top-[calc(50%+6px)] left-1.5 -translate-y-1/2" />
        </p>
        <ul>
          {RECORD.map(([date, text, kind], i) => (
            <li key={date} className="relative flex items-baseline gap-4 border-b border-border px-5 py-3 last:border-0">
              <span className="tnum w-12 shrink-0 text-[13.5px] text-subtle">{date}</span>
              <span className="min-w-0 flex-1 text-[15px] leading-snug">{text}</span>
              <span className="hidden shrink-0 rounded-full border border-border px-2 text-[12.5px] font-medium text-muted sm:inline">
                {kind}
              </span>
              {i === 1 && <span aria-hidden className="anno-dot absolute top-1/2 right-1.5 -translate-y-1/2" />}
            </li>
          ))}
        </ul>
      </div>
    </Stage>
  );
}

/** Where a note goes: to the model and back as a draft; nothing goes to LinkedIn. */
export function DataFlow() {
  const box = "rounded-lg border border-border bg-background px-4 py-3 text-[15px] leading-snug";
  const arrow = (
    <span aria-hidden className="flex shrink-0 items-center justify-center text-accent md:w-10">
      <ArrowRight className="size-5 rotate-90 md:rotate-0" strokeWidth={1.5} />
    </span>
  );
  return (
    <figure className="flex flex-col gap-4">
      <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
        <div className={box}>
          <p className="font-semibold">Your note</p>
          <p className="text-[14px] text-muted">Stored on our server in Mumbai</p>
        </div>
        {arrow}
        <div className={cx(box, "border-accent")}>
          <p className="font-semibold">The AI model</p>
          <p className="text-[14px] text-muted">Zero data retention; never trained on</p>
        </div>
        {arrow}
        <div className={box}>
          <p className="font-semibold">Your draft</p>
          <p className="text-[14px] text-muted">Checked, then shown only to you</p>
        </div>
      </div>
      <p className="flex items-center gap-3 text-[15px] text-muted">
        <span aria-hidden className="h-px w-10 shrink-0 border-t border-dashed border-border-strong" />
        LinkedIn: nothing is sent, read or posted. You copy the post yourself.
      </p>
    </figure>
  );
}
