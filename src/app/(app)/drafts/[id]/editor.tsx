"use client";

import { useActionState, useState } from "react";
import { CopyButton, SubmitButton } from "@/components/client";
import { Notice, Textarea } from "@/components/ui";
import { saveDraft, type SaveState } from "./actions";

export function DraftEditor({ draftId, body, hashtags }: { draftId: string; body: string; hashtags: string[] }) {
  const [text, setText] = useState(body);
  const [state, action] = useActionState<SaveState, FormData>(saveDraft.bind(null, draftId), { status: "idle" });
  const fullText = hashtags.length ? `${text}\n\n${hashtags.join(" ")}` : text;

  return (
    <form action={action} className="flex flex-col gap-3">
      <Textarea
        name="body"
        aria-label="Post text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-80"
      />
      {hashtags.length > 0 && <p className="text-sm text-muted">{hashtags.join(" ")}</p>}
      <div className="flex flex-wrap gap-2">
        <CopyButton text={fullText} label="Copy post" />
        <a
          href="https://www.linkedin.com/feed/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:border-accent"
        >
          Open LinkedIn
        </a>
        <SubmitButton variant="secondary" pendingLabel="Saving…">
          Save edits
        </SubmitButton>
      </div>
      {state.status !== "idle" && state.message && (
        <Notice tone={state.status === "saved" ? "success" : "danger"}>{state.message}</Notice>
      )}
    </form>
  );
}
