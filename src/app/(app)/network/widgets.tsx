"use client";

import { useActionState } from "react";
import { Compass, RefreshCw } from "lucide-react";
import { SubmitButton } from "@/components/client";
import { Notice } from "@/components/ui";
import { refreshSuggestions, type FormState } from "./actions";

/** Builds (or rebuilds) the suggestions of companies and roles worth knowing. */
export function SuggestButton({ first }: { first: boolean }) {
  const [state, action] = useActionState<FormState>(refreshSuggestions, { status: "idle" });
  return (
    <form action={action} className="flex flex-col gap-3">
      <SubmitButton variant={first ? "primary" : "ghost"} size="sm" className={first ? "self-start" : "-mr-2"} pendingLabel="Thinking it through…">
        {first ? <Compass aria-hidden /> : <RefreshCw aria-hidden />}
        {first ? "Suggest people to know" : "Refresh"}
      </SubmitButton>
      {state.status === "error" && state.message && <Notice tone="danger">{state.message}</Notice>}
    </form>
  );
}
