"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/client";
import { Hint, Input, Label, Notice } from "@/components/ui";
import { sendSignInEmail, verifySignInCode, type LoginState } from "./actions";

/** Step one asks for an email; step two takes the code from it (or the user opens the link). */
export function LoginForm({ next }: { next: string }) {
  const [sent, send] = useActionState<LoginState, FormData>(sendSignInEmail, { status: "idle" });
  const [checked, verify] = useActionState<LoginState, FormData>(verifySignInCode, { status: "idle" });
  // The send the user chose to change the address for; a new send shows the code step again.
  const [dismissed, setDismissed] = useState<number | undefined>();
  const email = sent.status === "sent" && sent.sentAt !== dismissed ? sent.email : undefined;

  if (!email) {
    return (
      <form action={send} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" defaultValue={sent.email} />
          <Hint>Use a personal email. Your employer won&apos;t see that you use this.</Hint>
        </div>
        <SubmitButton variant="gold" pendingLabel="Sending…">
          Email me a sign-in code
        </SubmitButton>
        {sent.status === "error" && sent.message && <Notice tone="danger">{sent.message}</Notice>}
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sent.message && <Notice tone="success">{sent.message}</Notice>}
      <form action={verify} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <div>
          <Label htmlFor="token">Code from the email</Label>
          <Input
            id="token"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            required
            autoFocus
            placeholder="123456"
            className="text-lg tracking-[0.2em]"
          />
          <Hint>Or open the link in the email, on any device.</Hint>
        </div>
        <SubmitButton variant="gold" pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
        {checked.status === "sent" && checked.message && <Notice tone="danger">{checked.message}</Notice>}
      </form>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <form action={send}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <SubmitButton variant="ghost" size="sm" className="-ml-3" pendingLabel="Sending…">
            Send a new code
          </SubmitButton>
        </form>
        <button type="button" className="link text-muted" onClick={() => setDismissed(sent.sentAt)}>
          Use a different email
        </button>
      </div>
    </div>
  );
}
