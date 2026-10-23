"use client";

import { useActionState, useRef, useState } from "react";
import { ExternalLink, Mail, PenLine } from "lucide-react";
import { CopyButton, SubmitButton } from "@/components/client";
import { Hint, Input, Label, Notice, Select, Textarea, buttonClass } from "@/components/ui";
import { linkedinPeopleSearch, mailtoLink } from "@/lib/network/links";
import {
  CHANNEL_LABEL,
  CHANNELS,
  CONTACT_STAGES,
  INTERACTION_KINDS,
  INTERACTION_LABEL,
  NETWORK_KIND_LABEL,
  NETWORK_KINDS,
  OUTREACH_LABEL,
  OUTREACH_PURPOSES,
  ROLE_STAGE_LABEL,
  ROLE_STAGES,
  STAGE_LABEL,
  type Channel,
  type NetworkKind,
  type OutreachPurpose,
} from "@/lib/network/taxonomy";
import {
  addRole,
  draftMessage,
  logInteraction,
  markSent,
  setNextStep,
  updateContact,
  type FormState,
  type MessageState,
} from "../../actions";

function useResettingAction(fn: (prev: FormState, data: FormData) => Promise<FormState>) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<FormState, FormData>(async (prev, data) => {
    const next = await fn(prev, data);
    if (next.status === "saved") ref.current?.reset();
    return next;
  }, { status: "idle" });
  return { ref, state, action };
}

function Result({ state }: { state: FormState }) {
  if (state.status === "error" && state.message) return <Notice tone="danger">{state.message}</Notice>;
  if (state.status === "saved" && state.message) return <Notice tone="success">{state.message}</Notice>;
  return null;
}

export function LogForm({ contactId, today }: { contactId: string; today: string }) {
  const { ref, state, action } = useResettingAction(logInteraction);
  const v = state.values ?? {};
  return (
    <form ref={ref} action={action} className="flex flex-col gap-4">
      <input type="hidden" name="contactId" value={contactId} />
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <Label htmlFor="kind">What happened</Label>
          <Select id="kind" name="kind" defaultValue={v.kind ?? "call"}>
            {INTERACTION_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {INTERACTION_LABEL[kind]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="occurredOn">When</Label>
          <Input id="occurredOn" name="occurredOn" type="date" defaultValue={v.occurredOn ?? today} max={today} />
        </div>
      </div>
      <div>
        <Label htmlFor="summary">What was said</Label>
        <Textarea id="summary" name="summary" defaultValue={v.summary} required maxLength={2000} className="min-h-20" placeholder="They're running a search for a regional CRO; asked for my view on the market." />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <Label htmlFor="nextStep">Next step</Label>
          <Input id="nextStep" name="nextStep" defaultValue={v.nextStep} maxLength={200} placeholder="Optional: send the note I promised" />
        </div>
        <div>
          <Label htmlFor="nextStepOn">By</Label>
          <Input id="nextStepOn" name="nextStepOn" type="date" defaultValue={v.nextStepOn} min={today} />
        </div>
      </div>
      <Result state={state} />
      <SubmitButton variant="secondary" size="sm" className="self-start" pendingLabel="Saving…">
        Log it
      </SubmitButton>
    </form>
  );
}

export function NextStepForm({ contactId, today, step, on }: { contactId: string; today: string; step: string | null; on: string | null }) {
  const [state, action] = useActionState<FormState, FormData>(setNextStep, { status: "idle" });
  const v = state.values;
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="contactId" value={contactId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <Label htmlFor="ns-text" className="sr-only">
            Next step
          </Label>
          <Input id="ns-text" name="nextStep" required maxLength={200} defaultValue={v?.nextStep ?? step ?? ""} placeholder="Ask about the regional search" className="mt-0" />
        </div>
        <div>
          <Label htmlFor="ns-on" className="sr-only">
            By
          </Label>
          <Input id="ns-on" name="nextStepOn" type="date" required defaultValue={v?.nextStepOn ?? on ?? ""} min={today} className="mt-0" />
        </div>
      </div>
      <Result state={state} />
      <SubmitButton variant="secondary" size="sm" className="self-start" pendingLabel="Saving…">
        {step ? "Change next step" : "Set next step"}
      </SubmitButton>
    </form>
  );
}

export interface EditableContact {
  id: string;
  kind: NetworkKind;
  name: string;
  unnamed: boolean;
  title: string | null;
  organisation: string | null;
  email: string | null;
  profile_url: string | null;
  how_met: string | null;
  notes: string;
  stage: (typeof CONTACT_STAGES)[number];
}

export function EditContactForm({ contact }: { contact: EditableContact }) {
  const [state, action] = useActionState<FormState, FormData>(updateContact, { status: "idle" });
  const v = state.values;
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={contact.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="e-name">Name</Label>
          <Input
            id="e-name"
            name="name"
            maxLength={120}
            defaultValue={v?.name ?? (contact.unnamed ? "" : contact.name)}
            placeholder={contact.unnamed ? "Add their name when you find them" : undefined}
            required={!contact.unnamed}
            autoComplete="off"
          />
        </div>
        <div>
          <Label htmlFor="e-stage">Where it stands</Label>
          <Select id="e-stage" name="stage" defaultValue={v?.stage ?? contact.stage}>
            {CONTACT_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABEL[stage]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="e-title">Their role</Label>
          <Input id="e-title" name="title" maxLength={160} defaultValue={v?.title ?? contact.title ?? ""} />
        </div>
        <div>
          <Label htmlFor="e-org">Firm or company</Label>
          <Input id="e-org" name="organisation" maxLength={160} defaultValue={v?.organisation ?? contact.organisation ?? ""} />
        </div>
        <div>
          <Label htmlFor="e-kind">Who they are to you</Label>
          <Select id="e-kind" name="kind" defaultValue={v?.kind ?? contact.kind}>
            {NETWORK_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {NETWORK_KIND_LABEL[kind]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="e-email">Email</Label>
          <Input id="e-email" name="email" type="email" maxLength={320} defaultValue={v?.email ?? contact.email ?? ""} autoComplete="off" />
        </div>
      </div>
      <div>
        <Label htmlFor="e-url">Profile link</Label>
        <Input id="e-url" name="profileUrl" maxLength={500} defaultValue={v?.profileUrl ?? contact.profile_url ?? ""} inputMode="url" autoComplete="off" />
        <Hint>Opened only in your browser. Winwall never visits it.</Hint>
      </div>
      <div>
        <Label htmlFor="e-how">How you know them</Label>
        <Input id="e-how" name="howMet" maxLength={200} defaultValue={v?.howMet ?? contact.how_met ?? ""} />
      </div>
      <div>
        <Label htmlFor="e-notes">Notes</Label>
        <Textarea id="e-notes" name="notes" maxLength={4000} defaultValue={v?.notes ?? contact.notes} className="min-h-24" />
      </div>
      <Result state={state} />
      <SubmitButton variant="secondary" size="sm" className="self-start" pendingLabel="Saving…">
        Save changes
      </SubmitButton>
    </form>
  );
}

export function RoleForm({ contactId, organisation }: { contactId?: string; organisation?: string | null }) {
  const { ref, state, action } = useResettingAction(addRole);
  const v = state.values ?? {};
  return (
    <form ref={ref} action={action} className="flex flex-col gap-4">
      {contactId && <input type="hidden" name="contactId" value={contactId} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="r-title">Role</Label>
          <Input id="r-title" name="title" defaultValue={v.title} required maxLength={160} placeholder="Chief Risk Officer" />
        </div>
        <div>
          <Label htmlFor="r-org">Company</Label>
          <Input id="r-org" name="organisation" maxLength={160} defaultValue={v.organisation ?? organisation ?? ""} placeholder="If they've said" />
        </div>
        <div>
          <Label htmlFor="r-loc">Location</Label>
          <Input id="r-loc" name="location" defaultValue={v.location} maxLength={120} placeholder="Dubai" />
        </div>
        <div>
          <Label htmlFor="r-stage">Stage</Label>
          <Select id="r-stage" name="stage" defaultValue={v.stage ?? "heard"}>
            {ROLE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {ROLE_STAGE_LABEL[stage]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="r-notes">Notes</Label>
        <Input id="r-notes" name="notes" defaultValue={v.notes} maxLength={2000} placeholder="Reports to the CEO; search closes in December" />
      </div>
      <Result state={state} />
      <SubmitButton variant="secondary" size="sm" className="self-start" pendingLabel="Saving…">
        Add role
      </SubmitButton>
    </form>
  );
}

/** Writes a message for the user to send themselves, checks it, and logs it when they say it's sent. */
export function MessageComposer({
  contactId,
  kind,
  email,
  profileUrl,
  searchTerms,
  defaultPurpose,
}: {
  contactId: string;
  kind: NetworkKind;
  email: string | null;
  profileUrl: string | null;
  searchTerms: string;
  defaultPurpose: OutreachPurpose;
}) {
  const [channel, setChannel] = useState<Channel>(email ? "email" : "linkedin");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [draft, action] = useActionState<MessageState, FormData>(async (prev, data) => {
    const next = await draftMessage(prev, data);
    if (next.status === "done") {
      setBody(next.body ?? "");
      setSubject(next.subject ?? "");
    }
    return next;
  }, { status: "idle" });
  const [sent, sendAction] = useActionState<FormState, FormData>(markSent, { status: "idle" });
  const blocking = draft.checks?.some((c) => c.blocking) ?? false;
  const fullText = channel === "email" && subject ? `${subject}\n\n${body}` : body;

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="contactId" value={contactId} />
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <Label htmlFor="purpose">What it&apos;s for</Label>
            <Select id="purpose" name="purpose" defaultValue={defaultPurpose}>
              {OUTREACH_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {OUTREACH_LABEL[p]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="channel">As</Label>
            <Select id="channel" name="channel" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABEL[c]}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <SubmitButton variant={draft.status === "done" ? "secondary" : "primary"} size="sm" className="self-start" pendingLabel="Writing…">
          <PenLine aria-hidden />
          {draft.status === "done" ? "Write another" : "Write it for me"}
        </SubmitButton>
        {draft.status === "error" && draft.message && <Notice tone="danger">{draft.message}</Notice>}
      </form>

      {draft.status === "done" && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          {channel === "email" && (
            <div>
              <Label htmlFor="m-subject">Subject</Label>
              <Input id="m-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
          )}
          <div>
            <Label htmlFor="m-body">Message</Label>
            <Textarea id="m-body" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-48" />
            {draft.note && <Hint>{draft.note}</Hint>}
          </div>
          {draft.checks?.map((check) => (
            <Notice key={check.message} tone={check.blocking ? "danger" : "neutral"}>
              <span className="font-semibold">{check.blocking ? "Fix before sending: " : "Check: "}</span>
              {check.message}
            </Notice>
          ))}
          {draft.checks?.length === 0 && (
            <Notice tone="success">Nothing confidential found{kind === "search_firm" ? "" : ", and nothing that reads as a job hunt"}.</Notice>
          )}
          <div className="flex flex-wrap gap-2">
            <CopyButton text={fullText.trim()} label="Copy message" variant={blocking ? "secondary" : "primary"} size="sm" />
            {channel === "email" ? (
              <a href={mailtoLink(email, subject || null, body)} className={buttonClass("secondary", undefined, "sm")}>
                <Mail aria-hidden />
                Open in your email
              </a>
            ) : (
              <a
                href={profileUrl ?? linkedinPeopleSearch(searchTerms)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("secondary", undefined, "sm")}
              >
                Open LinkedIn
                <ExternalLink aria-hidden />
              </a>
            )}
          </div>
          <form action={sendAction} className="flex flex-col gap-2 border-t border-border pt-3">
            <input type="hidden" name="contactId" value={contactId} />
            <input type="hidden" name="channel" value={channel} />
            <input type="hidden" name="body" value={fullText} />
            <p className="text-[13px] text-muted">You send it yourself. Then log it here so the follow-up isn&apos;t forgotten.</p>
            <Result state={sent} />
            {sent.status !== "saved" && (
              <SubmitButton variant="ghost" size="sm" className="-ml-2 self-start" pendingLabel="Logging…">
                I&apos;ve sent it
              </SubmitButton>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
