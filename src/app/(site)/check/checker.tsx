"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ChevronDown, CircleCheck, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import { Hint, Input, Label, Select, Textarea, buttonClass, cx } from "@/components/ui";
import { DEFAULT_RULES, type ConfidentialityRules, type EmployerPolicy, type NumberPolicy } from "@/lib/domain/types";
import { checkText, issueTier, type GuardrailIssue } from "@/lib/guardrails/check";

// Risk, Check and Style: shape and word carry the meaning; colour only helps (docs/DESIGN.md).
const TIERS = [
  { tier: 1, word: "Risk", title: "Fix before posting", icon: OctagonAlert, colour: "text-danger", tint: "bg-danger-soft" },
  { tier: 2, word: "Check", title: "Worth a look", icon: TriangleAlert, colour: "text-caution", tint: "bg-caution-soft" },
  { tier: 3, word: "Style", title: "Style", icon: Info, colour: "text-muted", tint: "bg-surface" },
] as const;

/** The free post check. Runs entirely in the browser: the draft is never sent anywhere. */
export function PostChecker({ sample }: { sample?: string }) {
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
      <form onSubmit={run} className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 sm:p-6">
        <div>
          <Label htmlFor="draft">Your draft</Label>
          <Textarea
            id="draft"
            name="draft"
            required
            defaultValue={sample}
            className="min-h-44 text-[17px]"
            placeholder="Paste the LinkedIn post you're about to publish."
          />
          <Hint>Checked in your browser. Your text isn&apos;t sent anywhere or stored.</Hint>
        </div>
        <details className="group rounded-lg border border-border px-4">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-[15px] font-medium [&::-webkit-details-marker]:hidden">
            Add your own rules (optional)
            <ChevronDown aria-hidden className="size-4 text-muted transition-transform duration-200 group-open:rotate-180" />
          </summary>
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
            <label className="flex cursor-pointer items-center gap-3 text-[15px]">
              <input type="checkbox" name="regulated" className="size-4 accent-[var(--ink)]" />I work at a regulated firm
              (finance, insurance, investment)
            </label>
          </div>
        </details>
        <button type="submit" className={buttonClass("primary", "self-start max-sm:w-full", "md")}>
          Check this post
        </button>
      </form>

      {issues && (
        <section aria-live="polite" className="flex flex-col gap-5">
          {serious === 0 ? (
            <p className="flex items-start gap-2.5 rounded-lg bg-success-soft px-4 py-3 text-[16px]">
              <CircleCheck aria-hidden className="mt-[3px] size-[18px] shrink-0 text-success" strokeWidth={2} />
              <span>
                <strong className="font-semibold">Clear.</strong> Nothing risky found by these checks. They can&apos;t know your
                employer&apos;s plans or your clients, so read it once as your manager would.
              </span>
            </p>
          ) : (
            <p className="text-[19px] font-medium">
              {serious === 1 ? "1 thing to look at" : `${serious} things to look at`} before you post
            </p>
          )}
          {TIERS.map(({ tier, word, title, icon: Icon, colour, tint }) => {
            const found = issues.filter((i) => issueTier(i.code) === tier);
            if (!found.length) return null;
            return (
              <div key={tier} className="flex flex-col gap-2">
                <h2 className="text-[15px] font-semibold text-muted">{title}</h2>
                <ul className="flex flex-col gap-2">
                  {found.map((issue) => (
                    <li
                      key={issue.message}
                      className={cx("flex items-start gap-2.5 rounded-lg px-4 py-3 text-[16px] leading-snug", tint)}
                    >
                      <Icon aria-hidden className={cx("mt-[2px] size-[18px] shrink-0", colour)} strokeWidth={2} />
                      <span>
                        <strong className="font-semibold">{word}.</strong> {issue.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <div className="flex flex-col gap-3 rounded-xl border border-border p-5 sm:p-6">
            <p className="text-[17px] font-semibold">The full check, on every draft</p>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[16px] leading-relaxed text-muted marker:text-subtle">
              <li>Every claim checked against your private record of real wins</li>
              <li>A careful read for client details, internal figures and anything not yet public</li>
              <li>How a peer, your leadership and a client or recruiter would likely read it</li>
              <li>A safer version when something needs fixing</li>
            </ul>
            <Link href="/login" className="text-link w-fit text-[16px] font-medium">
              Join the free beta
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
