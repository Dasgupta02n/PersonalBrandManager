import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, ChevronDown } from "lucide-react";
import { IconSubmitButton } from "@/components/client";
import { NetworkNav } from "@/components/network-nav";
import { EmptyState, PageHeader, SectionHeader, cx } from "@/components/ui";
import { bestEvidence } from "@/lib/data/search";
import { requireUser } from "@/lib/data/session";
import { ROLE_STAGE_LABEL, ROLE_STAGES, type RoleStage } from "@/lib/network/taxonomy";
import { deleteRole, updateRoleStage } from "../actions";
import { RoleForm } from "../contacts/[id]/forms";
import { StageSelect } from "./stage-select";

export const metadata: Metadata = { title: "Roles" };

interface RoleRow {
  id: string;
  title: string;
  organisation: string | null;
  location: string | null;
  stage: RoleStage;
  notes: string;
  contact_id: string | null;
}

export default async function RolesPage() {
  const { db, user } = await requireUser();
  const [rolesResult, contactsResult] = await Promise.all([
    db.from("network_roles").select("id, title, organisation, location, stage, notes, contact_id").eq("user_id", user.id).order("updated_at", { ascending: false }),
    db.from("network_contacts").select("id, name").eq("user_id", user.id),
  ]);
  const roles = (rolesResult.data ?? []) as RoleRow[];
  const names = new Map((contactsResult.data ?? []).map((c) => [c.id as string, c.name as string]));
  // For each open role, the wins from the record that best support it.
  const open = roles.filter((r) => r.stage !== "closed");
  const evidence = new Map(
    (await bestEvidence(db, user.id, open.map((r) => [r.title, r.organisation, r.notes].filter(Boolean).join(". ")))).map((found, i) => [open[i].id, found]),
  );
  const groups = ROLE_STAGES.map((stage) => ({ stage, roles: roles.filter((r) => r.stage === stage) })).filter((g) => g.roles.length);

  return (
    <>
      <NetworkNav active="/network/roles" />
      <PageHeader title="Roles" description="Roles you hear about, who they came through, and where each one stands. Private to you." />

      <details className="group rounded-xl bg-surface" open={roles.length === 0}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-semibold sm:px-5 [&::-webkit-details-marker]:hidden">
          Add a role
          <ChevronDown aria-hidden className="size-5 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4 sm:px-5">
          <RoleForm />
          <p className="mt-3 text-[13px] text-muted">To link a role to the person it came through, add it from their page.</p>
        </div>
      </details>

      {groups.length ? (
        groups.map((group) => (
          <section key={group.stage} className="flex flex-col gap-1">
            <SectionHeader title={ROLE_STAGE_LABEL[group.stage]} count={group.roles.length} />
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {group.roles.map((r) => (
                <li key={r.id} className={cx("flex flex-col gap-2 py-3 sm:flex-row sm:items-start", r.stage === "closed" && "opacity-70")}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold">{r.title}</p>
                    <p className="text-sm text-muted">
                      {[r.organisation, r.location].filter(Boolean).join(" · ")}
                      {r.contact_id && names.has(r.contact_id) && (
                        <>
                          {r.organisation || r.location ? " · " : ""}via{" "}
                          <Link href={`/network/contacts/${r.contact_id}`} className="text-accent underline underline-offset-4">
                            {names.get(r.contact_id)}
                          </Link>
                        </>
                      )}
                    </p>
                    {r.notes && <p className="mt-1 text-sm leading-snug">{r.notes}</p>}
                    {(evidence.get(r.id)?.length ?? 0) > 0 && (
                      <details className="group mt-2">
                        <summary className="flex min-h-10 w-fit cursor-pointer list-none items-center gap-1 text-sm font-medium text-accent [&::-webkit-details-marker]:hidden">
                          Your best evidence for it
                          <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
                        </summary>
                        <ul className="mt-1 flex flex-col gap-2 border-l-2 border-border pl-3">
                          {evidence.get(r.id)!.map(({ win }) => (
                            <li key={win.id} className="text-sm leading-snug">
                              {win.summary}
                              {win.metric ? <span className="text-muted"> · {win.metric}</span> : null}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <StageSelect id={r.id} stage={r.stage} action={updateRoleStage} />
                    <form action={deleteRole}>
                      <input type="hidden" name="id" value={r.id} />
                      <IconSubmitButton
                        label={`Delete ${r.title}`}
                        icon="trash"
                        className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                      />
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <EmptyState icon={BriefcaseBusiness} title="No roles yet">
          When a search consultant or a contact mentions a role, note it here so nothing slips.
        </EmptyState>
      )}
    </>
  );
}
