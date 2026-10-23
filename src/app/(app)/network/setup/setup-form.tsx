"use client";

import { useActionState, type ReactNode } from "react";
import { SubmitButton } from "@/components/client";
import { Hint, Input, Label, Notice } from "@/components/ui";
import type { NetworkGoals } from "@/lib/network/goals";
import {
  FUNCTION_LABEL,
  FUNCTIONS,
  MARKET_LABEL,
  MARKETS,
  SECTOR_LABEL,
  SECTORS,
  SENIORITY,
  SENIORITY_LABEL,
  TIMELINE_LABEL,
  TIMELINES,
} from "@/lib/network/taxonomy";
import { saveGoals, type FormState } from "../actions";

const chip =
  "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border-strong px-3 text-[15px] transition-colors duration-150 " +
  "hover:bg-band has-checked:border-ink has-checked:bg-surface-2 has-checked:font-medium has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent";

function Choices<T extends string>({
  legend,
  hint,
  name,
  type,
  options,
  labels,
  selected,
}: {
  legend: string;
  hint?: string;
  name: string;
  type: "checkbox" | "radio";
  options: readonly T[];
  labels: Record<T, string>;
  selected: readonly string[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      {hint && <Hint className="mt-0.5">{hint}</Hint>}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((value) => (
          <label key={value} className={chip}>
            <input type={type} name={name} value={value} defaultChecked={selected.includes(value)} className="accent-[var(--ink)]" />
            {labels[value]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-t border-border pt-6 first:border-0 first:pt-0">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function SetupForm({ goals, employer }: { goals: NetworkGoals | null; employer: string | null }) {
  const [state, action] = useActionState<FormState, FormData>(saveGoals, { status: "idle" });
  // After a failed save, show what the user chose rather than the saved answers.
  const v = state.values;
  const list = (key: string, saved: readonly string[] | undefined) => (v ? (v[key] ? v[key].split("|") : []) : (saved ?? []));
  const text = (key: string, saved: string | undefined) => v?.[key] ?? saved ?? "";
  return (
    <form action={action} className="flex flex-col gap-8">
      <Group title="Your next role">
        <div>
          <Label htmlFor="targetRoles">The role you&apos;d want next</Label>
          <Input
            id="targetRoles"
            name="targetRoles"
            required
            defaultValue={text("targetRoles", goals?.targetRoles.join(", "))}
            placeholder="Chief Risk Officer, Head of Risk for the region"
          />
          <Hint>Up to three, separated by commas. Rough is fine.</Hint>
        </div>
        <Choices legend="Level" name="seniority" type="radio" options={SENIORITY} labels={SENIORITY_LABEL} selected={list("seniority", goals?.seniority ? [goals.seniority] : [])} />
        <Choices legend="Function" hint="Choose all that fit." name="functions" type="checkbox" options={FUNCTIONS} labels={FUNCTION_LABEL} selected={list("functions", goals?.functions)} />
      </Group>

      <Group title="Where">
        <Choices legend="Sectors you'd consider" name="sectors" type="checkbox" options={SECTORS} labels={SECTOR_LABEL} selected={list("sectors", goals?.sectors)} />
        <Choices legend="Countries you'd work in" name="markets" type="checkbox" options={MARKETS} labels={MARKET_LABEL} selected={list("markets", goals?.markets)} />
        <div>
          <Label htmlFor="cities">Cities, if it matters</Label>
          <Input id="cities" name="cities" defaultValue={text("cities", goals?.cities.join(", "))} placeholder="Dubai, Mumbai" />
        </div>
      </Group>

      <Group title="Companies">
        <div>
          <Label htmlFor="currentCompany">Where you work now</Label>
          <Input id="currentCompany" name="currentCompany" defaultValue={text("currentCompany", goals?.currentCompany ?? employer ?? "")} placeholder="Optional" />
          <Hint>Kept private, and left out of every suggestion.</Hint>
        </div>
        <div>
          <Label htmlFor="competitors">Competitors where people like you work</Label>
          <Input id="competitors" name="competitors" defaultValue={text("competitors", goals?.competitors.join(", "))} placeholder="Up to eight, separated by commas" />
        </div>
        <div>
          <Label htmlFor="targetCompanies">Companies you&apos;d like to work for</Label>
          <Input id="targetCompanies" name="targetCompanies" defaultValue={text("targetCompanies", goals?.targetCompanies.join(", "))} placeholder="Up to eight, separated by commas" />
          <Hint>We suggest the roles worth knowing at each. You find the people yourself.</Hint>
        </div>
      </Group>

      <Group title="How you'd go about it">
        <Choices legend="Where you are" name="timeline" type="radio" options={TIMELINES} labels={TIMELINE_LABEL} selected={list("timeline", [goals?.timeline ?? "ready"])} />
        <div>
          <Label htmlFor="offer">What people come to you for</Label>
          <Input id="offer" name="offer" maxLength={300} defaultValue={text("offer", goals?.offer)} placeholder="Credit risk in fast-growing lenders; building risk teams" />
          <Hint>So your messages offer something before they ask for anything.</Hint>
        </div>
      </Group>

      {state.status === "error" && state.message && <Notice tone="danger">{state.message}</Notice>}
      <div className="flex flex-col gap-2">
        <SubmitButton className="self-start" pendingLabel="Building your suggestions…">
          {goals ? "Save and refresh suggestions" : "Save and see my suggestions"}
        </SubmitButton>
        <p className="text-[13px] text-muted">Suggestions use a little of your monthly AI allowance. Firm matches don&apos;t.</p>
      </div>
    </form>
  );
}
