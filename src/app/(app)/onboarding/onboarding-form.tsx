"use client";

import { useActionState } from "react";
import { SubmitButton, TimeZoneField } from "@/components/client";
import { Card, Hint, Input, Label, Notice, Select, Textarea } from "@/components/ui";
import { saveOnboarding, type OnboardingState } from "./actions";

export interface OnboardingDefaults {
  fullName: string;
  headline: string;
  timezone: string;
  promptTime: string;
  postsPerWeek: number;
  pillars: string[];
  targetRoles: string;
  targetIndustries: string;
  employerName: string;
  employerPolicy: string;
  neverMention: string;
  numberPolicy: string;
  samplePosts: string;
}

export function OnboardingForm({ defaults }: { defaults: OnboardingDefaults }) {
  const [state, action] = useActionState<OnboardingState, FormData>(saveOnboarding, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      <TimeZoneField name="timezone" defaultValue={defaults.timezone} />

      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold">About you</h2>
        <div>
          <Label htmlFor="fullName">Your name</Label>
          <Input id="fullName" name="fullName" required defaultValue={defaults.fullName} />
        </div>
        <div>
          <Label htmlFor="headline">Current role, in a line</Label>
          <Input
            id="headline"
            name="headline"
            defaultValue={defaults.headline}
            placeholder="Head of Sales, institutional business"
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="font-semibold">What do you want to be known for?</h2>
          <Hint>Up to 5 topics. Posts will build your authority in these.</Hint>
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i}>
            <Label htmlFor={`pillar${i + 1}`} className="sr-only">
              Topic {i + 1}
            </Label>
            <Input
              id={`pillar${i + 1}`}
              name={`pillar${i + 1}`}
              defaultValue={defaults.pillars[i] ?? ""}
              placeholder={["Channel strategy", "Building sales teams", "Infection prevention", "", ""][i] || `Topic ${i + 1}`}
              required={i === 0}
            />
          </div>
        ))}
        <div>
          <Label htmlFor="targetRoles">Who should notice you? (roles)</Label>
          <Input
            id="targetRoles"
            name="targetRoles"
            defaultValue={defaults.targetRoles}
            placeholder="CEOs, CHROs, search consultants"
          />
          <Hint>Separate with commas.</Hint>
        </div>
        <div>
          <Label htmlFor="targetIndustries">Industries</Label>
          <Input
            id="targetIndustries"
            name="targetIndustries"
            defaultValue={defaults.targetIndustries}
            placeholder="Healthcare, specialty chemicals"
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="font-semibold">Confidentiality</h2>
          <Hint>Every draft is checked against these before you see it.</Hint>
        </div>
        <div>
          <Label htmlFor="employerName">Your employer</Label>
          <Input id="employerName" name="employerName" defaultValue={defaults.employerName} />
        </div>
        <div>
          <Label htmlFor="employerPolicy">In posts, your employer should be…</Label>
          <Select id="employerPolicy" name="employerPolicy" defaultValue={defaults.employerPolicy}>
            <option value="generic">Described generically (“a large consumer goods company”)</option>
            <option value="name">Named</option>
            <option value="never">Never mentioned</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="neverMention">Never mention</Label>
          <Textarea
            id="neverMention"
            name="neverMention"
            defaultValue={defaults.neverMention}
            placeholder="Client names, product code names, internal projects…"
            className="min-h-20"
          />
          <Hint>One per line or separated by commas.</Hint>
        </div>
        <div>
          <Label htmlFor="numberPolicy">Business figures</Label>
          <Select id="numberPolicy" name="numberPolicy" defaultValue={defaults.numberPolicy}>
            <option value="rounded">Rounded (₹27 Cr, not ₹27.43 Cr)</option>
            <option value="relative">Relative only (“doubled”, “cut by half”)</option>
            <option value="exact">Exact figures are fine</option>
          </Select>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="font-semibold">Your voice</h2>
          <Hint>Paste 1–3 posts or messages you&apos;ve written, separated by a line of three dashes (---).</Hint>
        </div>
        <Textarea
          id="samplePosts"
          name="samplePosts"
          aria-label="Sample posts"
          defaultValue={defaults.samplePosts}
          className="min-h-40"
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold">Your daily rhythm</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="promptTime">Ask me what I did at</Label>
            <Input id="promptTime" name="promptTime" type="time" required defaultValue={defaults.promptTime} />
          </div>
          <div>
            <Label htmlFor="postsPerWeek">Posts per week</Label>
            <Input
              id="postsPerWeek"
              name="postsPerWeek"
              type="number"
              min={0}
              max={14}
              required
              defaultValue={defaults.postsPerWeek}
            />
          </div>
        </div>
      </Card>

      {state.error && <Notice tone="danger">{state.error}</Notice>}
      <SubmitButton pendingLabel="Saving…">Save and continue</SubmitButton>
    </form>
  );
}
