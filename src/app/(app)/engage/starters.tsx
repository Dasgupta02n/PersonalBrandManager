"use client";

import { useActionState, useState } from "react";
import { PenLine } from "lucide-react";
import { CopyButton, SubmitButton } from "@/components/client";
import { Hint, Label, Notice, Panel, Textarea, buttonClass } from "@/components/ui";
import { COMMENT_MAX_WORDS } from "@/lib/config/app";
import { countWords } from "@/lib/guardrails/check";
import { suggestStarters, type StarterState } from "./actions";

export function CommentStarters() {
  const [state, action] = useActionState<StarterState, FormData>(suggestStarters, { status: "idle" });
  const [ownComment, setOwnComment] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <form action={action} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="postText">Paste the post you want to add to</Label>
            <Textarea id="postText" name="postText" required className="min-h-36" placeholder="Paste the post's text here" />
            <Hint>We only read what you paste. Nothing is fetched from LinkedIn.</Hint>
          </div>
          <SubmitButton pendingLabel="Finding ways in…">Help me start a comment</SubmitButton>
          {state.status === "error" && state.message && <Notice tone="danger">{state.message}</Notice>}
        </form>
      </Panel>

      {state.starters && (
        <section className="flex flex-col gap-3" aria-label="Comment starters">
          <p className="text-sm text-muted">
            Pick one and finish it in your own words. A comment you complete reads as yours.
          </p>
          {state.starters.map((s) => (
            <StarterCard key={s.approach} approach={s.approach} starter={s.starter} add={s.add} notes={s.notes} />
          ))}
          {ownComment ? (
            <StarterCard approach="Your own comment" starter="" add="Write what you'd say to them in person." notes={[]} />
          ) : (
            <button type="button" onClick={() => setOwnComment(true)} className={buttonClass("ghost", "self-start", "sm")}>
              <PenLine aria-hidden />
              Write it myself
            </button>
          )}
        </section>
      )}
    </div>
  );
}

function StarterCard({ approach, starter, add, notes }: { approach: string; starter: string; add: string; notes: string[] }) {
  const [text, setText] = useState(starter ? `${starter} ` : "");
  const words = countWords(text);
  const id = `starter-${approach.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <Panel tone="outline" className="flex flex-col gap-3">
      <label htmlFor={id} className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">
        {approach}
      </label>
      <div>
        <Textarea id={id} value={text} onChange={(e) => setText(e.target.value)} className="mt-0 min-h-28" aria-describedby={`${id}-hint`} />
        <Hint id={`${id}-hint`}>
          {add} · {words} of {COMMENT_MAX_WORDS} words
        </Hint>
      </div>
      {notes.map((n) => (
        <Notice key={n} tone="neutral">
          <span className="font-semibold">Check: </span>
          {n}
        </Notice>
      ))}
      <CopyButton text={text.trim()} label="Copy comment" variant="primary" size="sm" className="self-start" />
    </Panel>
  );
}
