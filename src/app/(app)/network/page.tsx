import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, Compass, Search, UserPlus } from "lucide-react";
import { IconSubmitButton } from "@/components/client";
import { NetworkNav } from "@/components/network-nav";
import { Badge, EmptyState, Notice, PageHeader, Panel, SectionHeader, buttonClass, cx } from "@/components/ui";
import { CONTACT_COLUMNS, loadGoals, loadSuggestions, type ContactRow } from "@/lib/data/network";
import { requireUser } from "@/lib/data/session";
import { dueLabel } from "@/lib/network/dates";
import { matchFirms } from "@/lib/network/firms";
import { FIRM_KIND_LABEL } from "@/lib/network/taxonomy";
import { addDays, localParts } from "@/lib/schedule/time";
import { addFirm, addSuggestedPerson } from "./actions";
import { SuggestButton } from "./widgets";

export const metadata: Metadata = { title: "Network" };

const RELATION_LABEL = { competitor: "Competitor", target: "You'd join", adjacent: "Worth knowing" } as const;

export default async function NetworkPage({ searchParams }: PageProps<"/network">) {
  const { db, user, profile } = await requireUser();
  const { suggestions: suggestionsFlag } = await searchParams;
  const today = localParts(new Date(), profile.timezone).date;

  const [goals, suggestions, contactsResult, rolesResult] = await Promise.all([
    loadGoals(db, user.id),
    loadSuggestions(db, user.id),
    db.from("network_contacts").select(CONTACT_COLUMNS).eq("user_id", user.id).order("next_step_on"),
    db.from("network_roles").select("id, stage").eq("user_id", user.id),
  ]);
  const contacts = (contactsResult.data ?? []) as ContactRow[];

  if (!goals) {
    return (
      <>
        <NetworkNav active="/network" />
        <PageHeader
          title="Your network"
          description="The relationships that bring the next role, built quietly: the search firms that place people like you, and the people worth knowing at your competitors."
        />
        <Panel className="flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-semibold">Start with a few questions</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-muted">
              About two minutes. Your answers stay private and shape your first suggestions.
            </p>
          </div>
          <ol className="flex flex-col gap-3 text-[15px] leading-relaxed">
            {[
              "Tell us the role you'd want next, your sectors and where you'd work.",
              "Get the search firms that place people like you, from a directory checked against each firm's own website.",
              "Get the roles worth knowing at your competitors. You find the people and add them; we never name or look anyone up.",
            ].map((line, i) => (
              <li key={line} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-[13px] font-semibold tabular-nums">
                  {i + 1}
                </span>
                {line}
              </li>
            ))}
          </ol>
          <Link href="/network/setup" className={buttonClass("primary", "self-start")}>
            <Compass aria-hidden />
            Answer the questions
          </Link>
        </Panel>
        <PrivacyNote />
      </>
    );
  }

  const soon = addDays(today, 7);
  const due = contacts.filter((c) => c.next_step_on && c.next_step_on <= soon);
  const inConversation = contacts.filter((c) => c.stage === "in_conversation" || c.stage === "warm").length;
  const rolesInPlay = (rolesResult.data ?? []).filter((r) => r.stage !== "closed").length;
  const firmIds = new Map(contacts.filter((c) => c.firm_id).map((c) => [c.firm_id as string, c.id]));
  const added = new Set(contacts.map((c) => `${c.organisation ?? ""}|${c.title ?? ""}`.toLowerCase()));
  const firms = matchFirms(goals).slice(0, 5);

  return (
    <>
      <NetworkNav active="/network" />
      <PageHeader
        title="Your network"
        description="Private to you. Nothing is sent for you: you write, send and log every message yourself."
        action={
          <Link href="/network/contacts#add" className={buttonClass("secondary", undefined, "sm")}>
            <UserPlus aria-hidden />
            Add a person
          </Link>
        }
      />

      {suggestionsFlag === "failed" && (
        <Notice tone="neutral">Your search firm matches are ready. Suggestions of people to know couldn&apos;t be built just now; try again below.</Notice>
      )}

      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: "People", value: contacts.length, href: "/network/contacts" },
          { label: "Talking", value: inConversation, href: "/network/contacts?stage=in_conversation" },
          { label: "Roles in play", value: rolesInPlay, href: "/network/roles" },
        ].map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="flex flex-col justify-between rounded-xl bg-surface p-4 transition-colors duration-150 hover:bg-surface-2"
          >
            <dt className="text-[13px] font-medium text-muted">{tile.label}</dt>
            <dd className="mt-1 font-display text-display-s font-medium tabular-nums">{tile.value}</dd>
          </Link>
        ))}
      </dl>

      <section className="flex flex-col gap-1" aria-labelledby="due">
        <SectionHeader title={<span id="due">Next steps this week</span>} count={due.length} />
        {due.length ? (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {due.map((c) => {
              const label = dueLabel(c.next_step_on as string, today);
              return (
                <li key={c.id}>
                  <Link href={`/network/contacts/${c.id}`} className="flex items-start gap-3 py-3 transition-colors duration-150 hover:bg-band">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold">{c.name}</p>
                      <p className="text-[15px] leading-snug text-muted">{c.next_step}</p>
                    </div>
                    <span className={cx("shrink-0 pt-0.5 text-[13px] font-medium", label.overdue ? "text-danger" : "text-muted")}>{label.text}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[15px] text-muted">Nothing due. When you set a next step with someone, it shows here.</p>
        )}
      </section>

      <section className="flex flex-col gap-1" aria-labelledby="firms">
        <SectionHeader
          title={<span id="firms">Search firms for you</span>}
          action={
            <Link href="/network/firms" className="text-sm font-medium text-accent underline underline-offset-4">
              All firms
            </Link>
          }
        />
        {firms.length ? (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {firms.map(({ firm, reasons }) => {
              const contactId = firmIds.get(firm.id);
              return (
                <li key={firm.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <a
                      href={firm.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[15px] font-semibold hover:underline"
                    >
                      {firm.name}
                      <ArrowUpRight aria-hidden className="size-3.5 text-subtle" />
                    </a>
                    <p className="text-[13px] text-subtle">{FIRM_KIND_LABEL[firm.kind]}</p>
                    <p className="mt-1 text-sm leading-snug text-muted">{reasons.join(" · ")}</p>
                  </div>
                  {contactId ? (
                    <Link href={`/network/contacts/${contactId}`} className="flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-success">
                      <Check aria-hidden className="size-4" /> Added
                    </Link>
                  ) : (
                    <form action={addFirm}>
                      <input type="hidden" name="firmId" value={firm.id} />
                      <IconSubmitButton
                        label={`Add ${firm.name} to your network`}
                        icon="plus"
                        className="-mr-2 flex size-11 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
                      />
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[15px] text-muted">
            No firm in the directory has an office where you&apos;d work yet. <Link href="/network/firms" className="link">Browse all firms</Link>.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="people">
        <SectionHeader title={<span id="people">People to know</span>} action={suggestions ? <SuggestButton first={false} /> : undefined} />
        {suggestions ? (
          <>
            {suggestions.approach.length > 0 && (
              <Panel tone="outline">
                <ul className="flex flex-col gap-2 text-[15px] leading-relaxed">
                  {suggestions.approach.map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                      {line}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
            {suggestions.companies.map((company) => (
              <article key={company.name} className="flex flex-col gap-2 border-t border-border pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[17px] font-semibold">{company.name}</h3>
                  <Badge tone={company.relation === "adjacent" ? "neutral" : "accent"}>{RELATION_LABEL[company.relation]}</Badge>
                </div>
                <p className="text-[15px] leading-relaxed text-muted">{company.why}</p>
                <ul className="mt-1 flex flex-col divide-y divide-border">
                  {company.people.map((person) => {
                    const isAdded = added.has(`${company.name}|${person.title}`.toLowerCase());
                    return (
                      <li key={person.title} className="flex items-start gap-2 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-medium">{person.title}</p>
                          <p className="text-sm leading-snug text-muted">{person.why}</p>
                        </div>
                        <a
                          href={person.search}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Find ${person.title} at ${company.name} on LinkedIn (opens LinkedIn)`}
                          title="Find on LinkedIn"
                          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
                        >
                          <Search aria-hidden className="size-[18px]" />
                        </a>
                        {isAdded ? (
                          <span className="flex size-11 shrink-0 items-center justify-center text-success" title="In your network">
                            <Check aria-hidden className="size-[18px]" />
                            <span className="sr-only">In your network</span>
                          </span>
                        ) : (
                          <form action={addSuggestedPerson}>
                            <input type="hidden" name="title" value={person.title} />
                            <input type="hidden" name="organisation" value={company.name} />
                            <input type="hidden" name="relation" value={company.relation} />
                            <IconSubmitButton
                              label={`Add ${person.title} at ${company.name}`}
                              icon="plus"
                              className="-mr-2 flex size-11 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
                            />
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
            <p className="text-[13px] leading-snug text-subtle">
              Roles, never names. The search icon opens LinkedIn in your browser, signed in as you; Winwall never visits LinkedIn. Companies marked &ldquo;Worth knowing&rdquo; are AI suggestions: check them before you act.
            </p>
          </>
        ) : (
          <EmptyState icon={Compass} title="See who's worth knowing" action={<SuggestButton first />}>
            The roles worth knowing at your competitors and the companies you&apos;d join, built from your answers.
          </EmptyState>
        )}
      </section>

      <p className="text-sm text-muted">
        Based on your answers: {goals.targetRoles.join(", ")}.{" "}
        <Link href="/network/setup" className="font-medium text-accent underline underline-offset-4">
          Change them
        </Link>
      </p>
      <PrivacyNote />
    </>
  );
}

function PrivacyNote() {
  return (
    <p className="text-[13px] leading-snug text-subtle">
      Your network is private to you. People you add are stored only for you, never shared, never enriched from other sources, and deleted
      with your account. Search firm details come from each firm&apos;s own website.
    </p>
  );
}
