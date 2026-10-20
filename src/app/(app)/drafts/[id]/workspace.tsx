"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Copy,
  ExternalLink,
  Eye,
  Pencil,
  RefreshCw,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { copyText, SubmitButton } from "@/components/client";
import { Badge, Hint, Input, Notice, Panel, Textarea, buttonClass, cx } from "@/components/ui";
import type { GuardrailReport } from "@/lib/ai/tasks";
import { FORMAT_LABEL, READER_LABEL, WIN_KIND_LABEL } from "@/lib/content/labels";
import { LINKEDIN_MAX_CHARS, postWithHashtags, seeMoreCutoff } from "@/lib/content/linkedin";
import {
  blockingIssues,
  checkNotes,
  safetyChecks,
  styleSuggestions,
  verdictLines,
  type VerdictState,
} from "@/lib/content/verdict";
import type { PostFormat, WinKind } from "@/lib/domain/types";
import { countWords } from "@/lib/guardrails/check";
import {
  discardDraft,
  markPosted,
  recheckDraft,
  reviseDraft,
  saveDraft,
  unmarkPosted,
  type CheckState,
  type SaveState,
} from "./actions";

const LINKEDIN_COMPOSE_URL = "https://www.linkedin.com/feed/?shareActive=true";

const stateIcon: Record<VerdictState, { icon: LucideIcon; className: string }> = {
  ok: { icon: CircleCheck, className: "text-success" },
  check: { icon: TriangleAlert, className: "text-foreground" },
  block: { icon: CircleAlert, className: "text-danger" },
  unknown: { icon: CircleDashed, className: "text-muted" },
};

interface Props {
  draftId: string;
  status: "draft" | "ready" | "posted";
  format: PostFormat | null;
  body: string;
  hashtags: string[];
  report: GuardrailReport | null;
  sources: { id: string; summary: string; kind: WinKind }[];
  author: { name: string; headline: string };
  postedAt: string | null;
  postUrl: string | null;
  /** Works at a regulated firm: remind them to get approval before posting. */
  regulated: boolean;
}

export function DraftWorkspace(props: Props) {
  const { draftId, status, report } = props;
  const [text, setText] = useState(props.body);
  const [savedText, setSavedText] = useState(props.body);
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [acknowledged, setAcknowledged] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [justPosted, setJustPosted] = useState(false);
  const [, startTransition] = useTransition();

  const [saveState, saveAction] = useActionState<SaveState, FormData>(saveDraft.bind(null, draftId), { status: "idle" });
  const [checkState, checkAction] = useActionState<CheckState, FormData>(recheckDraft.bind(null, draftId), { status: "idle" });
  const [reviseState, reviseAction] = useActionState<CheckState, FormData>(reviseDraft.bind(null, draftId), { status: "idle" });

  // A revision or save on the server brings a new body; adopt it unless the user is mid-edit.
  if (props.body !== savedText) {
    if (text === savedText) setText(props.body);
    setSavedText(props.body);
  }

  const dirty = text !== savedText;
  const blocking = blockingIssues(report);
  const notes = checkNotes(report);
  const suggestions = styleSuggestions(report);
  const checks = safetyChecks(report);
  const lines = verdictLines(report);
  const passedChecks = checks.filter((c) => c.passed).length;
  const posted = status === "posted";
  const canCopy = !blocking.length || acknowledged;
  // A safer version offered by the latest check or revision; the user's text is never replaced unasked.
  const suggestedBody = reviseState.suggestedBody ?? checkState.suggestedBody ?? null;

  const save = () => {
    const data = new FormData();
    data.set("body", text);
    startTransition(() => saveAction(data));
  };

  const copyPost = async () => {
    if (dirty) save();
    if (await copyText(postWithHashtags(text, props.hashtags))) setStep(1);
  };

  return (
    <div data-pushed className="flex flex-1 flex-col gap-6">
      <div>
        <Link href="/drafts" className={buttonClass("ghost", "-ml-3 px-3", "sm")}>
          <ArrowLeft aria-hidden />
          Drafts
        </Link>
        <p className="mt-2 text-[13px] font-medium text-muted">{props.format ? FORMAT_LABEL[props.format] : "Post"}</p>
        <h1 className="font-display text-display-m font-medium">
          {posted ? "Posted" : blocking.length ? "Needs a look before posting" : "Ready when you are"}
        </h1>
      </div>

      {/* The promise, in three lines. */}
      <Panel className="flex flex-col gap-3" aria-label="Checks">
        <ul className="flex flex-col gap-2.5">
          {lines.map((line) => {
            const { icon: Icon, className } = stateIcon[line.state];
            return (
              <li key={line.key} className="flex items-start gap-2.5 text-[15px] font-medium">
                <Icon aria-hidden className={cx("mt-0.5 size-[18px] shrink-0", className)} />
                {line.key === "voice" && line.state === "unknown" ? (
                  <Link href="/style" className="link font-normal">
                    {line.label}
                  </Link>
                ) : (
                  <span>{line.label}</span>
                )}
              </li>
            );
          })}
        </ul>

        {blocking.length > 0 && (
          <Notice tone="danger">
            <ul className="flex flex-col gap-1">
              {blocking.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
            <p className="mt-1">Edit the post to remove it, or confirm below that you have permission.</p>
          </Notice>
        )}
        {notes.map((note) => (
          <Notice key={note} tone="neutral">
            <span className="font-semibold">Check: </span>
            {note}
          </Notice>
        ))}

        {report?.aiStale && !posted && (
          <form action={checkAction} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3.5 py-2.5">
            <p className="text-sm text-muted">You&apos;ve edited since the last full check.</p>
            <SubmitButton variant="secondary" size="sm" pendingLabel="Checking and reading it again…">
              <RefreshCw aria-hidden />
              Check again
            </SubmitButton>
          </form>
        )}
        {checkState.status === "error" && <Notice tone="danger">{checkState.message}</Notice>}
        {suggestedBody && suggestedBody !== text && (
          <Notice tone="accent">
            <p>There&apos;s a safer version that fixes the flagged lines.</p>
            <button
              type="button"
              className="link mt-1 font-semibold"
              onClick={() => {
                setText(suggestedBody);
                setMode("edit");
              }}
            >
              Use the safer version
            </button>
          </Notice>
        )}

        {checks.length > 0 && (
          <details className="group text-sm">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 font-medium text-muted hover:text-foreground">
              {passedChecks} of {checks.length} safety checks passed
              {suggestions.length > 0 && ` · ${suggestions.length} style ${suggestions.length === 1 ? "suggestion" : "suggestions"}`}
              <span aria-hidden className="transition group-open:rotate-90">›</span>
            </summary>
            <ul className="mt-1 flex flex-col gap-1.5">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  {c.passed ? (
                    <CircleCheck aria-hidden className="size-4 text-success" />
                  ) : (
                    <CircleAlert aria-hidden className="size-4 text-danger" />
                  )}
                  {c.label}
                  <span className="sr-only">{c.passed ? "passed" : "needs attention"}</span>
                </li>
              ))}
              {suggestions.map((s) => (
                <li key={s} className="text-muted">
                  Suggestion: {s}
                </li>
              ))}
            </ul>
          </details>
        )}
        <p className="text-[13px] leading-snug text-muted">
          {props.regulated
            ? "A check, not compliance approval: it catches what your rules and the review can see."
            : "A careful second read, not legal or compliance clearance."}
        </p>
      </Panel>

      {props.sources.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-muted">Built only from your wins</p>
          <ul className="flex flex-col gap-1.5">
            {props.sources.map((s) => (
              <li key={s.id} className="flex items-start gap-2 text-sm">
                <Badge>{WIN_KIND_LABEL[s.kind]}</Badge>
                <span className="line-clamp-2 leading-relaxed">{s.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <div role="tablist" aria-label="View" className="grid grid-cols-2 rounded-xl bg-surface p-1">
          {(
            [
              ["preview", "Preview", Eye],
              ["edit", "Edit", Pencil],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              role="tab"
              type="button"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={cx(
                "flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition",
                mode === value ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground",
              )}
            >
              <Icon aria-hidden className="size-4" />
              {label}
              {value === "edit" && dirty && <span className="sr-only"> (unsaved)</span>}
              {value === "edit" && dirty && <span aria-hidden className="size-1.5 rounded-full bg-foreground" />}
            </button>
          ))}
        </div>

        {mode === "preview" ? (
          <LinkedInPreview author={props.author} text={text} hashtags={props.hashtags} />
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <Textarea
                aria-label="Post text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="mt-0 min-h-80 font-preview"
              />
              <Hint>
                {countWords(text)} words · {text.length.toLocaleString("en-GB")} of {LINKEDIN_MAX_CHARS.toLocaleString("en-GB")}{" "}
                characters. Add one sentence only you could write — it makes the post yours.
              </Hint>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={save} disabled={!dirty} className={buttonClass("secondary", undefined, "sm")}>
                Save edits
              </button>
              {dirty && (
                <button type="button" onClick={() => setText(savedText)} className={buttonClass("ghost", undefined, "sm")}>
                  Undo changes
                </button>
              )}
            </div>
            {saveState.status === "error" && <Notice tone="danger">{saveState.message}</Notice>}

            {!posted && (
              <form action={reviseAction} className="flex flex-col gap-2">
                <p className="text-[13px] font-medium text-muted">
                  {dirty ? "Save your edits to use quick revisions" : "Quick revisions (checked again automatically)"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["shorter", "Shorter"],
                      ["humbler", "More modest"],
                      ["stronger_opening", "Stronger first line"],
                    ] as const
                  ).map(([value, label]) => (
                    <SubmitButton
                      key={value}
                      name="mode"
                      value={value}
                      variant="secondary"
                      size="sm"
                      disabled={dirty}
                      pendingLabel="Revising and checking…"
                    >
                      {label}
                    </SubmitButton>
                  ))}
                </div>
                {reviseState.status === "error" && <Notice tone="danger">{reviseState.message}</Notice>}
              </form>
            )}
          </div>
        )}
      </section>

      {report?.howItReads && (
        <Panel tone="outline" className="flex flex-col gap-4">
          <div>
            <h2 className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">How it reads</h2>
            <p className="mt-1 text-[13px] text-muted">A prediction from people&apos;s likely point of view, not a promise of reach.</p>
          </div>
          <ul className="flex flex-col gap-3">
            {report.howItReads.readers.map((r) => (
              <li key={r.reader} className="flex flex-col gap-0.5">
                <p className="text-[13px] font-medium text-muted">{READER_LABEL[r.reader]}</p>
                <p className="text-[15px]">{r.readsAs}</p>
                {r.concern && (
                  <p className="flex items-start gap-1.5 text-sm">
                    <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                    {r.concern}
                  </p>
                )}
              </li>
            ))}
          </ul>
          {report.howItReads.lines.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <p className="text-sm font-semibold">Lines worth changing</p>
              {report.howItReads.lines.map((l) => (
                <div key={l.quote} className="flex flex-col gap-1.5 text-sm">
                  <p className="text-muted">
                    <span className="line-through decoration-1">{l.quote}</span>
                  </p>
                  <p>{l.suggestion}</p>
                  {!posted && text.includes(l.quote) && (
                    <button
                      type="button"
                      className="link self-start font-semibold"
                      onClick={() => {
                        setText((t) => t.replace(l.quote, l.suggestion));
                        setMode("edit");
                      }}
                    >
                      Use this
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {!posted && (
        <form action={discardDraft.bind(null, draftId)} className="self-start">
          <SubmitButton variant="danger" size="sm" pendingLabel="Discarding…">
            Discard draft
          </SubmitButton>
        </form>
      )}

      {/* One primary action, in thumb reach, that advances through the posting steps. */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-auto border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        {posted ? (
          <div className="flex flex-col gap-2">
            {justPosted && (
              <div className="flex items-center justify-between gap-2 text-sm" role="status">
                <span>Marked as posted.</span>
                <form action={unmarkPosted.bind(null, draftId)} onSubmit={() => setJustPosted(false)}>
                  <button type="submit" className="link min-h-11 font-semibold">
                    Undo
                  </button>
                </form>
              </div>
            )}
            {props.postUrl ? (
              <a href={props.postUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "w-full", "lg")}>
                View on LinkedIn
                <ExternalLink aria-hidden />
              </a>
            ) : (
              <p className="py-2 text-center text-sm text-muted">
                Posted
                {props.postedAt &&
                  ` on ${new Date(props.postedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`}
              </p>
            )}
          </div>
        ) : !canCopy ? (
          <div className="flex flex-col gap-2">
            <button type="button" disabled className={buttonClass("primary", "w-full", "lg")}>
              <Copy aria-hidden />
              Copy post
            </button>
            <button type="button" onClick={() => setAcknowledged(true)} className={buttonClass("ghost", "w-full", "sm")}>
              Post anyway — I have permission
            </button>
          </div>
        ) : step === 0 ? (
          <div className="flex flex-col gap-1">
            <button type="button" onClick={copyPost} className={buttonClass("primary", "w-full", "lg")}>
              <Copy aria-hidden />
              Copy post
            </button>
            {props.regulated && (
              <p className="text-center text-[13px] text-muted">If your firm reviews social posts, get its approval first.</p>
            )}
          </div>
        ) : step === 1 ? (
          <div className="flex flex-col gap-1">
            <a
              href={LINKEDIN_COMPOSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setStep(2)}
              className={buttonClass("primary", "w-full", "lg")}
            >
              Copied · Open LinkedIn
              <ExternalLink aria-hidden />
            </a>
            <p className="text-center text-[13px] text-muted">Paste it into a new post. You post it yourself.</p>
          </div>
        ) : (
          <form action={markPosted.bind(null, draftId)} onSubmit={() => setJustPosted(true)} className="flex flex-col gap-2">
            <details>
              <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-medium text-muted">
                Add the post&apos;s link (optional)
              </summary>
              <Input name="postUrl" type="url" placeholder="https://www.linkedin.com/posts/…" aria-label="Link to your post" />
            </details>
            <div className="flex gap-2">
              <button type="button" onClick={copyPost} className={buttonClass("secondary", "aspect-square px-0", "lg")} aria-label="Copy again">
                <Copy aria-hidden />
              </button>
              <SubmitButton size="lg" className="flex-1" pendingLabel="Saving…">
                Mark as posted
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** The post as it will appear, in the system font LinkedIn uses, with the "see more" fold marked. */
function LinkedInPreview({ author, text, hashtags }: { author: Props["author"]; text: string; hashtags: string[] }) {
  const cut = seeMoreCutoff(text);
  const head = text.slice(0, cut);
  const tail = text.slice(cut).replace(/^\s+/, "");
  return (
    <figure className="rounded-xl border border-border bg-field p-4 font-preview">
      <figcaption className="sr-only">Preview of your post on LinkedIn</figcaption>
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold">
          {initials(author.name) || "Y"}
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold">{author.name}</p>
          {author.headline && <p className="truncate text-[13px] text-muted">{author.headline}</p>}
        </div>
      </div>
      <div className="mt-3 max-w-[65ch] text-[15px] leading-6 whitespace-pre-wrap">
        {head}
        {tail && (
          <>
            <span role="separator" className="my-3 flex items-center gap-2 text-[13px] text-muted">
              <span className="h-px flex-1 border-t border-dashed border-border-strong" />
              about here, LinkedIn shows “…see more”
              <span className="h-px flex-1 border-t border-dashed border-border-strong" />
            </span>
            {tail}
          </>
        )}
      </div>
      {hashtags.length > 0 && <p className="mt-3 text-[15px] text-accent">{hashtags.join(" ")}</p>}
    </figure>
  );
}
