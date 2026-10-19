"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { SubmitButton } from "@/components/client";
import { Hint, Input, Label, Notice, Textarea } from "@/components/ui";
import { refreshProfile, type ProfileState } from "./actions";

export function RefreshForm({ defaults, hasSuggestions }: { defaults: { headline: string; about: string; experience: string }; hasSuggestions: boolean }) {
  const [state, action] = useActionState<ProfileState, FormData>(refreshProfile, { status: "idle" });
  return (
    <form action={action} className="flex flex-col gap-4">
      <details open={!hasSuggestions}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold">
          What you have today (optional, makes suggestions sharper)
        </summary>
        <div className="mt-2 flex flex-col gap-4">
          <div>
            <Label htmlFor="headline">Your LinkedIn headline</Label>
            <Input id="headline" name="headline" defaultValue={defaults.headline} maxLength={400} />
          </div>
          <div>
            <Label htmlFor="about">Your About section</Label>
            <Textarea id="about" name="about" defaultValue={defaults.about} maxLength={3000} />
          </div>
          <div>
            <Label htmlFor="experience">Your current role&apos;s bullets, or the CV lines for it</Label>
            <Textarea id="experience" name="experience" defaultValue={defaults.experience} maxLength={3000} />
            <Hint>Paste them yourself; we never read your LinkedIn.</Hint>
          </div>
        </div>
      </details>
      {state.status === "error" && <Notice tone="danger">{state.message}</Notice>}
      <SubmitButton className="self-start" pendingLabel="Reading your record…">
        <RefreshCw aria-hidden />
        {hasSuggestions ? "Suggest again" : "Suggest updates"}
      </SubmitButton>
    </form>
  );
}
