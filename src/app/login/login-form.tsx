"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/client";
import { Input, Label, Notice } from "@/components/ui";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<LoginState, FormData>(sendMagicLink, { status: "idle" });

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </div>
      <SubmitButton pendingLabel="Sending your link…">Email me a sign-in link</SubmitButton>
      {state.status !== "idle" && state.message && (
        <Notice tone={state.status === "sent" ? "success" : "danger"}>{state.message}</Notice>
      )}
    </form>
  );
}
