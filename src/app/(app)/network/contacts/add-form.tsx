"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/client";
import { Hint, Input, Label, Notice, Select, Textarea } from "@/components/ui";
import { NETWORK_KIND_LABEL, NETWORK_KINDS } from "@/lib/network/taxonomy";
import { addContact, type FormState } from "../actions";

/** Someone the user already knows or has found themselves. Nothing is looked up. */
export function AddContactForm() {
  const [state, action] = useActionState<FormState, FormData>(addContact, { status: "idle" });
  const v = state.values ?? {};
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={v.name} required maxLength={120} autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="kind">Who they are to you</Label>
          <Select id="kind" name="kind" defaultValue={v.kind ?? "search_firm"}>
            {NETWORK_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {NETWORK_KIND_LABEL[kind]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="title">Their role</Label>
          <Input id="title" name="title" defaultValue={v.title} maxLength={160} placeholder="Partner, financial services" />
        </div>
        <div>
          <Label htmlFor="organisation">Firm or company</Label>
          <Input id="organisation" name="organisation" defaultValue={v.organisation} maxLength={160} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" defaultValue={v.email} type="email" maxLength={320} placeholder="Optional" autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="profileUrl">Profile link</Label>
          <Input id="profileUrl" name="profileUrl" defaultValue={v.profileUrl} maxLength={500} placeholder="Optional" inputMode="url" autoComplete="off" />
        </div>
      </div>
      <div>
        <Label htmlFor="howMet">How you know them</Label>
        <Input id="howMet" name="howMet" defaultValue={v.howMet} maxLength={200} placeholder="Met at a client event in 2024" />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={v.notes} maxLength={4000} className="min-h-20" placeholder="What they cover, what you talked about" />
        <Hint>Only you see this. Their name is never sent to the AI.</Hint>
      </div>
      {state.status === "error" && state.message && <Notice tone="danger">{state.message}</Notice>}
      <SubmitButton size="sm" className="self-start" pendingLabel="Saving…">
        Add to network
      </SubmitButton>
    </form>
  );
}
