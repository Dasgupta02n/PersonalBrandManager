"use client";

import { useActionState, useRef, useState, useSyncExternalStore } from "react";
import { Mic, MicOff, RefreshCw } from "lucide-react";
import { SubmitButton } from "@/components/client";
import { Hint, Input, Notice, Textarea, buttonClass, cx } from "@/components/ui";
import { CAPTURE_STARTERS } from "@/lib/content/labels";
import {
  answerFollowUp,
  logEntry,
  moreIdeas,
  writeDraftFromIdea,
  type DraftState,
  type IdeasState,
  type LogState,
} from "./actions";

const stateTone = (status: LogState["status"]) =>
  status === "done" ? "success" : status === "partial" ? "neutral" : "danger";

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null;
}

/** Dictation through the browser's own speech recognition, shown only where it exists. */
const noSubscription = () => () => {};

function VoiceButton({ onText }: { onText: (text: string) => void }) {
  // Server render and first paint assume no support; the browser answers after hydration.
  const supported = useSyncExternalStore(noSubscription, () => getRecognition() !== null, () => false);
  const [listening, setListening] = useState(false);
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Recognition = getRecognition();
    if (!Recognition) return;
    const r = new Recognition();
    r.lang = navigator.language || "en-GB";
    r.interimResults = false;
    r.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (text) onText(text);
    };
    r.onend = () => setListening(false);
    recognition.current = r;
    setListening(true);
    r.start();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={listening}
      aria-label={listening ? "Stop dictation" : "Dictate your note"}
      className={buttonClass("secondary", "aspect-square px-0", "md")}
    >
      {listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}
    </button>
  );
}

export function CaptureForm({ prompt, comeback }: { prompt: string; comeback: boolean }) {
  const [state, action] = useActionState<LogState, FormData>(logEntry, { status: "idle" });
  const [text, setText] = useState("");
  const [handled, setHandled] = useState(state);
  const area = useRef<HTMLTextAreaElement>(null);

  // Clear the note once it has been saved and processed; keep it on errors.
  if (state !== handled) {
    setHandled(state);
    if (state.status === "done") setText("");
  }

  const append = (piece: string) => {
    setText((current) => (current.trim() ? `${current.trimEnd()}\n${piece}` : piece));
    requestAnimationFrame(() => {
      const el = area.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="text" className="font-display text-[22px] leading-7 font-medium">
          {prompt}
        </label>
        {comeback && (
          <p className="mt-1 text-[15px] text-muted">Welcome back. Catch up on the last few days if you like — it takes a minute.</p>
        )}
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 pr-8 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]" role="group" aria-label="Quick starts">
        {CAPTURE_STARTERS.map(({ label, starter }) => (
          <button
            key={label}
            type="button"
            onClick={() => append(starter)}
            className="min-h-11 shrink-0 rounded-full border border-border-strong px-3.5 text-sm font-medium text-foreground transition hover:bg-surface-2"
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <Textarea
          ref={area}
          id="text"
          name="text"
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-describedby="text-hint"
          placeholder="Closed the review with the regional team; agreed the new pricing approach."
          className="mt-0"
        />
        <Hint id="text-hint">A line is enough — a decision, a fix, a thank-you you received. Private. Nothing is posted without you.</Hint>
      </div>

      <div className="flex gap-2">
        <SubmitButton size="md" className="flex-1" pendingLabel="Finding your wins and ideas…">
          Find my wins
        </SubmitButton>
        <VoiceButton onText={append} />
      </div>

      {state.status !== "idle" && state.message && <Notice tone={stateTone(state.status)}>{state.message}</Notice>}
    </form>
  );
}

export function FollowUpForm({ entryId, question }: { entryId: string; question: string }) {
  const [state, action] = useActionState<LogState, FormData>(answerFollowUp, { status: "idle" });
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="entryId" value={entryId} />
      <label htmlFor="answer" className="text-[15px] leading-relaxed">
        {question}
      </label>
      <Input id="answer" name="answer" placeholder="Your part, or a number you can share" className="mt-0" />
      <SubmitButton size="sm" variant="secondary" className="self-start" pendingLabel="Adding…">
        Add to my win
      </SubmitButton>
      {state.status !== "idle" && state.message && <Notice tone={stateTone(state.status)}>{state.message}</Notice>}
    </form>
  );
}

export function WriteDraftButton({ ideaId, prominent }: { ideaId: string; prominent: boolean }) {
  const [state, action] = useActionState<DraftState, FormData>(writeDraftFromIdea, {});
  return (
    <form action={action} className={cx("flex flex-col gap-2", prominent && "flex-1")}>
      <input type="hidden" name="ideaId" value={ideaId} />
      <SubmitButton
        variant={prominent ? "primary" : "secondary"}
        size={prominent ? "md" : "sm"}
        pendingLabel="Writing, checking and reading it as others would…"
      >
        Write this post
      </SubmitButton>
      {state.error && <Notice tone="danger">{state.error}</Notice>}
    </form>
  );
}

export function MoreIdeasButton({ label = "Try other angles", primary = false }: { label?: string; primary?: boolean }) {
  const [state, action] = useActionState<IdeasState, FormData>(moreIdeas, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <SubmitButton variant={primary ? "primary" : "ghost"} size="sm" pendingLabel="Finding other angles…">
        <RefreshCw aria-hidden />
        {label}
      </SubmitButton>
      {state.error && <Notice tone="danger">{state.error}</Notice>}
    </form>
  );
}
