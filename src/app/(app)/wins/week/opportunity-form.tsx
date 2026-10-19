"use client";

import { useActionState, useRef } from "react";
import { SubmitButton } from "@/components/client";
import { Input, Label, Notice, Select } from "@/components/ui";
import { OPPORTUNITY_LABEL } from "@/lib/content/labels";
import { logOpportunity, type OpportunityState } from "./actions";

export function OpportunityForm({ today }: { today: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<OpportunityState, FormData>(async (prev: OpportunityState, data: FormData) => {
    const next = await logOpportunity(prev, data);
    if (next.status === "saved") formRef.current?.reset();
    return next;
  }, { status: "idle" });

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <Label htmlFor="kind">What came to you?</Label>
          <Select id="kind" name="kind" defaultValue="headhunter">
            {Object.entries(OPPORTUNITY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="occurredOn">When</Label>
          <Input id="occurredOn" name="occurredOn" type="date" defaultValue={today} max={today} />
        </div>
      </div>
      <div>
        <Label htmlFor="description">A few words</Label>
        <Input id="description" name="description" required placeholder="Search firm asked about a regional role" />
      </div>
      {state.status === "error" && <Notice tone="danger">{state.message}</Notice>}
      {state.status === "saved" && <Notice tone="success">{state.message}</Notice>}
      <SubmitButton variant="secondary" size="sm" className="self-start" pendingLabel="Saving…">
        Log it
      </SubmitButton>
    </form>
  );
}
