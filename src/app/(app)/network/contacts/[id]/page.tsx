import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronDown, ChevronLeft, Search, Trash2 } from "lucide-react";
import { IconSubmitButton } from "@/components/client";
import { Badge, Panel, SectionHeader, cx } from "@/components/ui";
import { CONTACT_COLUMNS, roleLine, type ContactRow } from "@/lib/data/network";
import { requireUser } from "@/lib/data/session";
import { dayLabel, dueLabel } from "@/lib/network/dates";
import { firmById } from "@/lib/network/firms";
import { linkedinPeopleSearch, safeWebUrl } from "@/lib/network/links";
import {
  INTERACTION_LABEL,
  NETWORK_KIND_LABEL,
  ROLE_STAGE_LABEL,
  SECTOR_LABEL,
  STAGE_LABEL,
  type InteractionKind,
  type OutreachPurpose,
  type RoleStage,
} from "@/lib/network/taxonomy";
import { loadGoals } from "@/lib/data/network";
import { localParts } from "@/lib/schedule/time";
import { clearNextStep, deleteContact, deleteInteraction } from "../../actions";
import { EditContactForm, LogForm, MessageComposer, NextStepForm, RoleForm } from "./forms";

export const metadata: Metadata = { title: "Contact" };

const iconButton = "flex size-11 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground";

function suggestedPurpose(contact: ContactRow, interactions: number): OutreachPurpose {
  if (interactions === 0) return contact.how_met ? "reconnect" : "introduce";
  if (contact.stage === "dormant") return "reconnect";
  return "follow_up";
}

export default async function ContactPage({ params }: PageProps<"/network/contacts/[id]">) {
  const { id } = await params;
  const { db, user, profile } = await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const today = localParts(new Date(), profile.timezone).date;

  const [contactResult, interactionsResult, rolesResult, goals] = await Promise.all([
    db.from("network_contacts").select(CONTACT_COLUMNS).eq("id", id).eq("user_id", user.id).maybeSingle(),
    db
      .from("network_interactions")
      .select("id, kind, summary, occurred_on")
      .eq("contact_id", id)
      .eq("user_id", user.id)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    db.from("network_roles").select("id, title, organisation, location, stage").eq("contact_id", id).eq("user_id", user.id),
    loadGoals(db, user.id),
  ]);
  const contact = contactResult.data as ContactRow | null;
  if (!contact) notFound();
  const interactions = (interactionsResult.data ?? []) as { id: string; kind: InteractionKind; summary: string; occurred_on: string }[];
  const roles = (rolesResult.data ?? []) as { id: string; title: string; organisation: string | null; location: string | null; stage: RoleStage }[];

  const firm = firmById(contact.firm_id);
  const line = roleLine(contact);
  const profileUrl = safeWebUrl(contact.profile_url);
  const due = contact.next_step_on ? dueLabel(contact.next_step_on, today) : null;
  const sector = goals?.sectors[0] ? SECTOR_LABEL[goals.sectors[0]] : "";
  const searchTerms = contact.unnamed
    ? contact.kind === "search_firm"
      ? `${contact.organisation ?? contact.name} ${sector}`
      : `${contact.title ?? ""} ${contact.organisation ?? ""}`
    : `${contact.name} ${contact.organisation ?? ""}`;

  return (
    <>
      <Link href="/network/contacts" className="-mb-4 flex min-h-11 w-fit items-center gap-1 text-sm font-medium text-muted hover:text-foreground">
        <ChevronLeft aria-hidden className="size-4" />
        People
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{NETWORK_KIND_LABEL[contact.kind]}</Badge>
          <Badge tone={contact.stage === "warm" || contact.stage === "in_conversation" ? "success" : "neutral"}>{STAGE_LABEL[contact.stage]}</Badge>
        </div>
        <h1 className="font-display text-display-m font-medium text-balance">{contact.name}</h1>
        {line && <p className="text-[17px] text-muted">{line}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {firm && (
            <a href={firm.website} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 font-medium text-accent underline underline-offset-4">
              Firm website <ArrowUpRight aria-hidden className="size-3.5" />
            </a>
          )}
          {profileUrl && (
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 font-medium text-accent underline underline-offset-4">
              Profile <ArrowUpRight aria-hidden className="size-3.5" />
            </a>
          )}
          {contact.unnamed && (
            <a
              href={linkedinPeopleSearch(searchTerms)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 font-medium text-accent underline underline-offset-4"
            >
              <Search aria-hidden className="size-3.5" />
              {contact.kind === "search_firm" ? "Find the consultant who covers your area" : "Find this person on LinkedIn"}
            </a>
          )}
        </div>
        {contact.unnamed && (
          <p className="text-[13px] leading-snug text-subtle">
            The search opens LinkedIn in your own browser. When you find the right person, add their name below.
          </p>
        )}
      </header>

      <section className="flex flex-col gap-2" aria-labelledby="next">
        <SectionHeader title={<span id="next">Next step</span>} />
        {contact.next_step && due ? (
          <Panel className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">{contact.next_step}</p>
              <p className={cx("text-sm", due.overdue ? "text-danger" : "text-muted")}>{due.text}</p>
            </div>
            <form action={clearNextStep}>
              <input type="hidden" name="contactId" value={contact.id} />
              <IconSubmitButton label="Mark as done" icon="check" className={cx(iconButton, "-mr-2 -mt-1.5 hover:text-success")} />
            </form>
          </Panel>
        ) : null}
        <details className="group" open={!contact.next_step}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-medium text-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
            {contact.next_step ? "Change it" : "Set one"}
            <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="pt-2">
            <NextStepForm contactId={contact.id} today={today} step={contact.next_step} on={contact.next_step_on} />
          </div>
        </details>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="write">
        <SectionHeader title={<span id="write">Write to {contact.unnamed ? "them" : contact.name.split(/\s+/)[0]}</span>} />
        <Panel>
          <MessageComposer
            contactId={contact.id}
            kind={contact.kind}
            email={contact.email}
            profileUrl={profileUrl}
            searchTerms={searchTerms}
            defaultPurpose={suggestedPurpose(contact, interactions.length)}
          />
        </Panel>
        <p className="text-[13px] leading-snug text-subtle">
          Written from your record and checked for anything confidential. Their name is never sent to the AI: it writes a placeholder, and the name is filled in afterwards.
        </p>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="log">
        <SectionHeader title={<span id="log">Conversation</span>} count={interactions.length} />
        <details className="group rounded-xl bg-surface" open={interactions.length === 0}>
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-[15px] font-semibold sm:px-5 [&::-webkit-details-marker]:hidden">
            Log a call, meeting or message
            <ChevronDown aria-hidden className="size-5 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 sm:px-5">
            <LogForm contactId={contact.id} today={today} />
          </div>
        </details>
        {interactions.length > 0 && (
          <ol className="flex flex-col divide-y divide-border border-y border-border">
            {interactions.map((i) => (
              <li key={i.id} className="flex items-start gap-3 py-3">
                <p className="w-16 shrink-0 pt-0.5 text-[13px] text-muted tabular-nums">{dayLabel(i.occurred_on, today)}</p>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-subtle">{INTERACTION_LABEL[i.kind]}</p>
                  <p className="text-[15px] leading-relaxed whitespace-pre-line">{i.summary}</p>
                </div>
                <form action={deleteInteraction}>
                  <input type="hidden" name="id" value={i.id} />
                  <input type="hidden" name="contactId" value={contact.id} />
                  <IconSubmitButton label="Delete this entry" icon="trash" className={cx(iconButton, "-mr-2 hover:bg-danger-soft hover:text-danger")} />
                </form>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="roles">
        <SectionHeader
          title={<span id="roles">Roles through {contact.unnamed ? "them" : contact.name.split(/\s+/)[0]}</span>}
          count={roles.length}
        />
        {roles.length > 0 && (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {roles.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium">{r.title}</p>
                  <p className="text-sm text-muted">{[r.organisation, r.location].filter(Boolean).join(" · ")}</p>
                </div>
                <Badge tone={r.stage === "offer" ? "success" : "neutral"}>{ROLE_STAGE_LABEL[r.stage]}</Badge>
              </li>
            ))}
          </ul>
        )}
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-medium text-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
            Add a role they told you about
            <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="pt-2">
            <RoleForm contactId={contact.id} organisation={contact.kind === "search_firm" ? null : contact.organisation} />
          </div>
        </details>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="details">
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
            <h2 id="details" className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">
              Details {contact.unnamed ? "· add their name" : ""}
            </h2>
            <ChevronDown aria-hidden className="size-5 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="pt-2">
            <EditContactForm contact={contact} />
          </div>
        </details>
      </section>

      <form action={deleteContact} className="border-t border-border pt-4">
        <input type="hidden" name="id" value={contact.id} />
        <button type="submit" className="flex min-h-11 items-center gap-2 text-sm font-medium text-danger hover:underline">
          <Trash2 aria-hidden className="size-4" />
          Remove from your network
        </button>
        <p className="text-[13px] text-subtle">Removes them, their conversation log and their link to any roles.</p>
      </form>
    </>
  );
}
