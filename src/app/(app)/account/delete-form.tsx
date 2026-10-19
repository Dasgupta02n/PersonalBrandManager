"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/client";
import { Input, Label, Notice } from "@/components/ui";
import { deleteAccount, type DeleteState } from "./actions";

export function DeleteAccountForm() {
  const [state, action] = useActionState<DeleteState, FormData>(deleteAccount, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <Label htmlFor="confirm">Type “delete” to confirm</Label>
        <Input id="confirm" name="confirm" autoComplete="off" required className="max-w-xs" />
      </div>
      {state.error && <Notice tone="danger">{state.error}</Notice>}
      <SubmitButton variant="danger" size="sm" className="self-start border border-danger/40" pendingLabel="Deleting…">
        Delete my account and everything in it
      </SubmitButton>
    </form>
  );
}
