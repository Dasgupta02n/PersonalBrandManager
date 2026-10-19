"use client";

import { useActionState, useRef } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { SubmitButton } from "@/components/client";
import { Input, Notice } from "@/components/ui";
import { addNote, learnAgain, type StyleState } from "./actions";

export function AddNoteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<StyleState, FormData>(async (prev: StyleState, data: FormData) => {
    const next = await addNote(prev, data);
    if (next.status === "done") formRef.current?.reset();
    return next;
  }, { status: "idle" });
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <label htmlFor="note" className="text-sm font-semibold">
        Add a note of your own
      </label>
      <div className="flex gap-2">
        <Input id="note" name="note" required maxLength={120} placeholder="Never use the word “journey”" className="mt-0 flex-1" />
        <SubmitButton variant="secondary" pendingLabel="Adding…" aria-label="Add note">
          <Plus aria-hidden />
          Add
        </SubmitButton>
      </div>
      {state.status === "error" && <Notice tone="danger">{state.message}</Notice>}
    </form>
  );
}

export function LearnAgainForm() {
  const [state, action] = useActionState<StyleState, FormData>(learnAgain, { status: "idle" });
  return (
    <form action={action} className="flex flex-col gap-2">
      <SubmitButton variant="secondary" size="sm" className="self-start" pendingLabel="Reading your writing…">
        <RefreshCw aria-hidden />
        Learn from my latest writing
      </SubmitButton>
      {state.status !== "idle" && state.message && <Notice tone={state.status === "error" ? "danger" : "success"}>{state.message}</Notice>}
    </form>
  );
}
