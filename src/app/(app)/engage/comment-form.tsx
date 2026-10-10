"use client";

import { useActionState } from "react";
import { CopyButton, SubmitButton } from "@/components/client";
import { Card, Label, Notice, Textarea } from "@/components/ui";
import { suggestComments, type CommentState } from "./actions";

export function CommentForm() {
  const [state, action] = useActionState<CommentState, FormData>(suggestComments, { status: "idle" });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <form action={action} className="flex flex-col gap-3">
          <Label htmlFor="postText">Paste the post you want to comment on</Label>
          <Textarea id="postText" name="postText" required className="min-h-40" />
          <SubmitButton pendingLabel="Drafting comments…">Suggest comments</SubmitButton>
          {state.status === "error" && state.message && <Notice tone="danger">{state.message}</Notice>}
        </form>
      </Card>

      {state.options?.map((option, i) => (
        <Card key={i} className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">{option.approach}</p>
          <p className="whitespace-pre-line">{option.text}</p>
          {option.warnings.map((w) => (
            <p key={w} className="text-sm text-warning">
              {w}
            </p>
          ))}
          <div>
            <CopyButton text={option.text} label="Copy comment" />
          </div>
        </Card>
      ))}
    </div>
  );
}
