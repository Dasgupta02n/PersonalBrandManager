import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Users } from "lucide-react";
import { NetworkNav } from "@/components/network-nav";
import { EmptyState, PageHeader, Panel, cx } from "@/components/ui";
import { CONTACT_COLUMNS, roleLine, type ContactRow } from "@/lib/data/network";
import { requireUser } from "@/lib/data/session";
import { dayLabel, dueLabel } from "@/lib/network/dates";
import { CONTACT_STAGES, NETWORK_KIND_LABEL, STAGE_LABEL, type ContactStage } from "@/lib/network/taxonomy";
import { localParts } from "@/lib/schedule/time";
import { AddContactForm } from "./add-form";

export const metadata: Metadata = { title: "People" };

export default async function ContactsPage({ searchParams }: PageProps<"/network/contacts">) {
  const { db, user, profile } = await requireUser();
  const { stage: stageParam } = await searchParams;
  const stage = CONTACT_STAGES.includes(stageParam as ContactStage) ? (stageParam as ContactStage) : null;
  const today = localParts(new Date(), profile.timezone).date;

  const { data } = await db.from("network_contacts").select(CONTACT_COLUMNS).eq("user_id", user.id).order("updated_at", { ascending: false });
  const all = (data ?? []) as ContactRow[];
  const contacts = stage ? all.filter((c) => c.stage === stage) : all;
  const counts = Object.fromEntries(CONTACT_STAGES.map((s) => [s, all.filter((c) => c.stage === s).length])) as Record<ContactStage, number>;

  return (
    <>
      <NetworkNav active="/network/contacts" />
      <PageHeader title="People" description="Everyone you're building a relationship with, and where each one stands." />

      <details id="add" className="group scroll-mt-20 rounded-xl bg-surface open:pb-1" open={all.length === 0}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-semibold sm:px-5 [&::-webkit-details-marker]:hidden">
          Add a person
          <ChevronDown aria-hidden className="size-5 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4 sm:px-5">
          <AddContactForm />
        </div>
      </details>

      {all.length > 0 && (
        <nav aria-label="Filter by stage" className="-mx-4 overflow-x-auto px-4">
          <ul className="flex gap-2">
            {[null, ...CONTACT_STAGES].map((s) => (
              <li key={s ?? "all"}>
                <Link
                  href={s ? `/network/contacts?stage=${s}` : "/network/contacts"}
                  aria-current={s === stage ? "page" : undefined}
                  className={cx(
                    "flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-150",
                    s === stage ? "border-ink bg-ink text-ink-foreground" : "border-border-soft text-muted hover:text-foreground",
                  )}
                >
                  {s ? STAGE_LABEL[s] : "All"}
                  <span className="tabular-nums opacity-70">{s ? counts[s] : all.length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {contacts.length ? (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {contacts.map((c) => {
            const line = roleLine(c);
            const due = c.next_step_on ? dueLabel(c.next_step_on, today) : null;
            return (
              <li key={c.id}>
                <Link href={`/network/contacts/${c.id}`} className="flex items-start gap-3 py-3 transition-colors duration-150 hover:bg-band">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold">
                      {c.name}
                      {c.unnamed && <span className="font-normal text-subtle"> · name to add</span>}
                    </p>
                    {line && <p className="truncate text-[15px] text-muted">{line}</p>}
                    <p className="mt-0.5 text-[13px] text-subtle">
                      {NETWORK_KIND_LABEL[c.kind]} · {STAGE_LABEL[c.stage]}
                      {c.last_contact_on && ` · last in touch ${dayLabel(c.last_contact_on, today)}`}
                    </p>
                  </div>
                  {due && <span className={cx("shrink-0 pt-0.5 text-[13px] font-medium", due.overdue ? "text-danger" : "text-muted")}>{due.text}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : all.length ? (
        <Panel tone="outline">
          <p className="text-[15px] text-muted">Nobody at this stage.</p>
        </Panel>
      ) : (
        <EmptyState icon={Users} title="No one here yet">
          Add someone you know, or start from the <Link href="/network/firms" className="link">search firms</Link> and the people{" "}
          <Link href="/network" className="link">suggested for you</Link>.
        </EmptyState>
      )}
    </>
  );
}
