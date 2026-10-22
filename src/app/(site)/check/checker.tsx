"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, CircleAlert, CircleCheck, Info, ShieldCheck, TriangleAlert } from "lucide-react";
import { Hint, Input, Label, Notice, Panel, Select, Textarea, buttonClass } from "@/components/ui";
import { DEFAULT_RULES, type ConfidentialityRules, type EmployerPolicy, type NumberPolicy } from "@/lib/domain/types";
import { checkText, issueTier, type GuardrailIssue } from "@/lib/guardrails/check";

const TIERS = [
  { tier: 1, title: "Fix before posting", icon: CircleAlert, tone: "danger" },
  { tier: 2, title: "Worth a look", icon: TriangleAlert, tone: "neutral" },
  { tier: 3, title: "Style", icon: Info, tone: "accent" },
] as const;

/** The free post check. Runs entirely in the browser: the draft is never sent anywhere. */
export function PostChecker() {
  const [issues, setIssues] = useState<GuardrailIssue[] | null>(null);

  const run = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const list = (key: string) =>
      String(data.get(key) ?? "")
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    const rules: ConfidentialityRules = {
      ...DEFAULT_RULES,
      employerName: String(data.get("employer") ?? "").trim() || null,
      employerPolicy: (data.get("employerPolicy") as EmployerPolicy) ?? "generic",
      neverMention: list("neverMention"),
      numberPolicy: (data.get("numberPolicy") as NumberPolicy) ?? "rounded",
      regulated: data.get("regulated") === "on",
    };
    setIssues(checkText(String(data.get("draft") ?? ""), { kind: "post", rules, flagClientNames: true }).issues);
  };

  const serious = issues?.filter((i) => issueTier(i.code) < 3).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={run} className="card flex flex-col gap-4 p-5 sm:p-7">
        <div>
          <Label htmlFor="draft">Your draft</Label>
          <Textarea id="draft" name="draft" required className="min-h-48" placeholder="Paste the LinkedIn post you're about to publish." />
          <Hint>Checked in your browser. Your text isn&apos;t sent anywhere or stored.</Hint>
        </div>
        <details className="rounded-2xl border border-[var(--card-border)] bg-surface px-4">
          <summary className="flex min-h-12 cursor-pointer list-none items-center text-sm font-semibold">Add your own rules (optional)</summary>
          <div className="flex flex-col gap-4 pb-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="employer">Your employer</Label>
                <Input id="employer" name="employer" autoComplete="organization" />
              </div>
              <div>
                <Label htmlFor="employerPolicy">In posts, your employer is…</Label>
                <Select id="employerPolicy" name="employerPolicy" defaultValue="generic">
                  <option value="generic">Described generally</option>
                  <option value="name">Named</option>
                  <option value="never">Never mentioned</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="neverMention">Names to keep out</Label>
              <Input id="neverMention" name="neverMention" placeholder="Client names, project code names" />
              <Hint>Separated by commas.</Hint>
            </div>
            <div>
              <Label htmlFor="numberPolicy">Business figures</Label>
              <Select id="numberPolicy" name="numberPolicy" defaultValue="rounded">
                <option value="rounded">Rounded only</option>
                <option value="relative">Relative only (“doubled”)</option>
                <option value="exact">Exact figures are fine</option>
              </Select>
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" name="regulated" className="size-4 accent-[var(--ink)]" />
              I work at a regulated firm (finance, insurance, investment)
            </label>
          </div>
        </details>
        <button type="submit" className={buttonClass("gold", "self-start", "lg")}>
          <ShieldCheck aria-hidden />
          Check my post
        </button>
      </form>

      {issues && (
        <section aria-live="polite" className="flex flex-col gap-4">
          {serious === 0 ? (
            <Notice tone="success" icon={CircleCheck}>
              Nothing risky found by these checks. They can&apos;t know your employer&apos;s plans or your clients, so read it once
              as your manager would.
            </Notice>
          ) : (
            <p className="text-lg font-semibold">
              {serious === 1 ? "1 thing to look at" : `${serious} things to look at`} before you post
            </p>
          )}
          {TIERS.map(({ tier, title, icon, tone }) => {
            const found = issues.filter((i) => issueTier(i.code) === tier);
            if (!found.length) return null;
            return (
              <div key={tier} className="flex flex-col gap-2">
                <h2 className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">{title}</h2>
                {found.map((issue) => (
                  <Notice key={issue.message} tone={tone} icon={icon}>
                    {issue.message}
                  </Notice>
                ))}
              </div>
            );
          })}

          <Panel className="flex flex-col gap-3">
            <p className="font-semibold">The full check, on every draft</p>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-[15px] leading-relaxed text-muted marker:text-brass">
              <li>Every claim checked against your private record of real wins</li>
              <li>A careful read for client details, internal figures and anything not yet public</li>
              <li>How a peer, your leadership and a client or recruiter would likely read it</li>
              <li>A safer version when something needs fixing</li>
            </ul>
            <Link href="/login" className={buttonClass("gold", "self-start", "md")}>
              Join the beta
              <ArrowRight aria-hidden />
            </Link>
          </Panel>
        </section>
      )}
    </div>
  );
}
