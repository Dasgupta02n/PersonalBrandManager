import type { Metadata } from "next";
import { CircleCheck, EyeOff } from "lucide-react";
import { CopyButton, SubmitButton } from "@/components/client";
import { RecordNav } from "@/components/record-nav";
import { Badge, Notice, PageHeader, Panel, SectionHeader } from "@/components/ui";
import type { ProfileSection } from "@/lib/ai/tasks";
import { loadUserContext } from "@/lib/data/context";
import { requireUser } from "@/lib/data/session";
import { checkText, issueTier } from "@/lib/guardrails/check";
import { markApplied } from "./actions";
import { RefreshForm } from "./refresh-form";

export const metadata: Metadata = { title: "Profile and CV" };

const SECTION_LABEL: Record<ProfileSection, { title: string; where: string }> = {
  headline: { title: "Headline", where: "LinkedIn → your profile → the pencil by your name" },
  about: { title: "About", where: "LinkedIn → your profile → About" },
  experience: { title: "Current role", where: "LinkedIn → Experience → your current role" },
  cv: { title: "CV bullets", where: "Your CV, under your current role" },
  skills: { title: "Skills to add", where: "LinkedIn → Skills" },
};
const ORDER: ProfileSection[] = ["headline", "about", "experience", "cv", "skills"];

interface SuggestionRow {
  id: string;
  section: ProfileSection;
  current_text: string;
  proposed_text: string;
  reason: string;
  status: string;
  week_start: string;
}

export default async function ProfilePage() {
  const { db, user } = await requireUser();
  const [latest, ctx] = await Promise.all([
    db
      .from("profile_suggestions")
      .select("id, section, current_text, proposed_text, reason, status, week_start")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
    loadUserContext(db, user.id),
  ]);

  const rows = (latest.data ?? []) as SuggestionRow[];
  const week = rows[0]?.week_start;
  const current = new Map<ProfileSection, SuggestionRow>();
  for (const row of rows) {
    if (row.week_start === week && !current.has(row.section)) current.set(row.section, row);
  }
  const suggestions = ORDER.flatMap((section) => (current.get(section) ? [current.get(section)!] : []));
  const pasted = {
    headline: current.get("headline")?.current_text ?? "",
    about: current.get("about")?.current_text ?? "",
    experience: current.get("experience")?.current_text ?? "",
  };

  return (
    <>
      <RecordNav active="/wins/profile" />
      <PageHeader
        title="Profile and CV"
        description="Updates for your LinkedIn profile and CV, built only from your record and checked like a post. You copy what you like."
      />

      <Notice tone="neutral" icon={EyeOff}>
        LinkedIn can tell your network when you edit your profile. If you&apos;d rather it didn&apos;t, turn off sharing profile
        updates in LinkedIn&apos;s visibility settings before you paste anything.
      </Notice>

      <Panel>
        <RefreshForm defaults={pasted} hasSuggestions={suggestions.length > 0} />
      </Panel>

      {suggestions.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader title="Suggestions" count={suggestions.length} />
          {suggestions.map((s) => {
            const issues = checkText(s.proposed_text, { kind: "comment", rules: ctx.rules, commentMaxWords: 10_000 }).issues.filter(
              (i) => i.code !== "length" && issueTier(i.code) < 3,
            );
            const applied = s.status === "applied";
            return (
              <Panel key={s.id} tone="outline" className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold">{SECTION_LABEL[s.section].title}</h3>
                  {applied && (
                    <Badge tone="success" icon={CircleCheck}>
                      Updated
                    </Badge>
                  )}
                </div>
                <p className="rounded-xl bg-surface px-3.5 py-3 text-[15px] leading-relaxed whitespace-pre-line">{s.proposed_text}</p>
                {issues.map((issue) => (
                  <Notice key={issue.message} tone={issueTier(issue.code) === 1 ? "danger" : "neutral"}>
                    {issue.message}
                  </Notice>
                ))}
                {s.reason && <p className="text-sm leading-relaxed text-muted">{s.reason}</p>}
                <p className="text-[13px] text-muted">{SECTION_LABEL[s.section].where}</p>
                <div className="flex flex-wrap gap-2">
                  <CopyButton text={s.proposed_text} size="sm" />
                  {!applied && (
                    <form action={markApplied}>
                      <input type="hidden" name="id" value={s.id} />
                      <SubmitButton variant="ghost" size="sm" pendingLabel="Saving…">
                        I&apos;ve updated it
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </Panel>
            );
          })}
        </section>
      )}
    </>
  );
}
