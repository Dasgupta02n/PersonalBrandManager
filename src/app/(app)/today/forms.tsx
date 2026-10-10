"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/client";
import { Label, Notice, Textarea } from "@/components/ui";
import { logEntry, writeDraftFromIdea, type DraftState, type LogState } from "./actions";

export function LogEntryForm({ prompt }: { prompt: string }) {
  const [state, action] = useActionState<LogState, FormData>(logEntry, { status: "idle" });

  return (
    <form action={action} className="flex flex-col gap-3">
      <Label htmlFor="text" className="text-base">
        {prompt}
      </Label>
      <Textarea
        id="text"
        name="text"
        required
        placeholder="Deals, launches, problems solved, people you developed, decisions you made. A line or two is enough."
      />
      <SubmitButton pendingLabel="Saving and finding your wins…">Save</SubmitButton>
      {state.status !== "idle" && state.message && (
        <Notice tone={state.status === "done" ? "success" : state.status === "partial" ? "warning" : "danger"}>
          {state.message}
        </Notice>
      )}
    </form>
  );
}

export function WriteDraftForm({ ideaId }: { ideaId: string }) {
  const [state, action] = useActionState<DraftState, FormData>(writeDraftFromIdea, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="ideaId" value={ideaId} />
      <SubmitButton pendingLabel="Writing and checking…">Write this post</SubmitButton>
      {state.error && <Notice tone="danger">{state.error}</Notice>}
    </form>
  );
}
