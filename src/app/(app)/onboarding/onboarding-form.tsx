"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { SubmitButton, TimeZoneField } from "@/components/client";
import { Hint, Input, Label, Notice, Panel, Select, Textarea, buttonClass, cx } from "@/components/ui";
import { TONE_LABEL } from "@/lib/content/labels";
import type { PromptChannel, Tone } from "@/lib/domain/types";
import { saveOnboarding, type OnboardingState } from "./actions";

export interface OnboardingDefaults {
  fullName: string;
  headline: string;
  timezone: string;
  promptTime: string;
  promptChannel: PromptChannel;
  routineCue: string;
  postsPerWeek: number;
  tone: Tone;
  pillars: string[];
  targetRoles: string;
  targetIndustries: string;
  employerName: string;
  employerPolicy: string;
  neverMention: string;
  noGoTopics: string;
  numberPolicy: string;
  regulated: boolean;
  maskNames: boolean;
  samplePosts: string;
}

/* ---------- Field groups, shared by setup and settings ---------- */

function AboutFields({ d }: { d: OnboardingDefaults }) {
  return (
    <>
      <div>
        <Label htmlFor="fullName">Your name</Label>
        <Input id="fullName" name="fullName" required autoComplete="name" defaultValue={d.fullName} />
      </div>
      <div>
        <Label htmlFor="headline">Your role, in a line</Label>
        <Input id="headline" name="headline" defaultValue={d.headline} placeholder="Head of Sales, institutional business" />
        <Hint>Shown on your post previews. Never shared.</Hint>
      </div>
    </>
  );
}

function TopicFields({ d }: { d: OnboardingDefaults }) {
  const examples = ["Building sales teams", "Channel strategy", "Pricing decisions"];
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <Label htmlFor={`pillar${i + 1}`} className="sr-only">
            Topic {i + 1}
          </Label>
          <Input
            id={`pillar${i + 1}`}
            name={`pillar${i + 1}`}
            defaultValue={d.pillars[i] ?? ""}
            placeholder={i === 0 ? `e.g. ${examples[0]}` : `Topic ${i + 1} (optional)`}
            required={i === 0}
            className={i ? "mt-0" : undefined}
          />
        </div>
      ))}
      <Hint>We use these to choose which wins become posts.</Hint>
    </div>
  );
}

function AudienceFields({ d }: { d: OnboardingDefaults }) {
  return (
    <>
      <div>
        <Label htmlFor="targetRoles">Who should notice your work?</Label>
        <Input id="targetRoles" name="targetRoles" defaultValue={d.targetRoles} placeholder="CEOs, CHROs, search consultants" />
        <Hint>Roles, separated by commas.</Hint>
      </div>
      <div>
        <Label htmlFor="targetIndustries">Industries</Label>
        <Input id="targetIndustries" name="targetIndustries" defaultValue={d.targetIndustries} placeholder="Healthcare, specialty chemicals" />
      </div>
    </>
  );
}

function SafetyFields({ d }: { d: OnboardingDefaults }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="employerName">Your employer</Label>
          <Input id="employerName" name="employerName" defaultValue={d.employerName} autoComplete="organization" />
        </div>
        <div>
          <Label htmlFor="employerPolicy">In posts, your employer is…</Label>
          <Select id="employerPolicy" name="employerPolicy" defaultValue={d.employerPolicy}>
            <option value="generic">Described generally</option>
            <option value="name">Named</option>
            <option value="never">Never mentioned</option>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="neverMention">Never mention</Label>
        <Textarea
          id="neverMention"
          name="neverMention"
          defaultValue={d.neverMention}
          placeholder="Client names, product code names, internal projects"
          className="min-h-20"
        />
        <Hint>One per line or separated by commas. Every draft is checked against this list.</Hint>
      </div>
      <div>
        <Label htmlFor="numberPolicy">Business figures</Label>
        <Select id="numberPolicy" name="numberPolicy" defaultValue={d.numberPolicy}>
          <option value="rounded">Rounded (27 million, not 27.43 million)</option>
          <option value="relative">Relative only (“doubled”, “cut by half”)</option>
          <option value="exact">Exact figures are fine</option>
        </Select>
      </div>
      <CheckRow name="regulated" defaultChecked={d.regulated} label="I work at a regulated firm">
        Finance, insurance or investment. Promissory and performance language is stopped, and you&apos;re reminded to get your
        firm&apos;s approval before posting.
      </CheckRow>
      <CheckRow name="maskNames" defaultChecked={d.maskNames} label="Keep other people's names out of my record">
        Colleagues and clients are saved as roles (“my manager”, “a client”). Your never-mention list is never stored in notes.
      </CheckRow>
    </>
  );
}

function CheckRow({ name, defaultChecked, label, children }: { name: string; defaultChecked: boolean; label: string; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-strong px-3.5 py-3 has-checked:border-ink">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 size-4 shrink-0 accent-[var(--ink)]" />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-muted">{children}</span>
      </span>
    </label>
  );
}

function FitFields({ d }: { d: OnboardingDefaults }) {
  return (
    <>
      <div>
        <Label htmlFor="noGoTopics">Topics you never post about</Label>
        <Input id="noGoTopics" name="noGoTopics" defaultValue={d.noGoTopics} placeholder="Politics, my previous employer, salaries" />
        <Hint>Separated by commas. Drafts that touch these are stopped.</Hint>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold">How you come across</legend>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
          {(Object.keys(TONE_LABEL) as Tone[]).map((tone) => (
            <label
              key={tone}
              className="flex min-h-12 cursor-pointer flex-col justify-center rounded-xl border border-border-strong px-3.5 py-2.5 transition has-checked:border-ink has-checked:bg-surface-2"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <input type="radio" name="tone" value={tone} defaultChecked={d.tone === tone} className="accent-[var(--ink)]" />
                {TONE_LABEL[tone].label}
              </span>
              <span className="mt-0.5 text-[13px] text-muted">{TONE_LABEL[tone].hint}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

function RhythmFields({ d }: { d: OnboardingDefaults }) {
  return (
    <>
      <div>
        <Label htmlFor="routineCue">Tie it to something you already do</Label>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
          <span>After I</span>
          <Input
            id="routineCue"
            name="routineCue"
            defaultValue={d.routineCue}
            placeholder="finish my last meeting"
            maxLength={120}
            className="mt-0 min-w-0 flex-1 basis-48"
          />
          <span className="basis-full text-muted">…then I&apos;ll note one thing that moved forward.</span>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="promptTime">Remind me at</Label>
          <Input id="promptTime" name="promptTime" type="time" required defaultValue={d.promptTime} />
        </div>
        <div>
          <Label htmlFor="promptChannel">Remind me by</Label>
          <Select id="promptChannel" name="promptChannel" defaultValue={d.promptChannel}>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="web_push">App notification</option>
          </Select>
        </div>
      </div>
      <Hint className="mt-0">Workdays only. Reminders never include what you wrote. They start in a coming update.</Hint>
      <div>
        <Label htmlFor="postsPerWeek">Posts per week you&apos;d like to aim for</Label>
        <Input id="postsPerWeek" name="postsPerWeek" type="number" inputMode="numeric" min={0} max={14} required defaultValue={d.postsPerWeek} />
      </div>
      <p className="text-sm leading-relaxed text-muted">
        Most people need about two months for a daily routine to feel automatic. Missing a day doesn&apos;t undo it.
      </p>
    </>
  );
}

function VoiceFields({ d }: { d: OnboardingDefaults }) {
  return (
    <div>
      <Label htmlFor="samplePosts">Paste up to three posts or messages you wrote</Label>
      <Textarea id="samplePosts" name="samplePosts" defaultValue={d.samplePosts} className="min-h-40" />
      <Hint>
        Separate them with a line of three dashes (---). Used only to match how you write.{" "}
        <Link href="/style" className="link">
          See what we&apos;ve learned
        </Link>
      </Hint>
    </div>
  );
}

/* ---------- First-run setup: five short steps that end on the first win ---------- */

const STEPS: { title: string; reason: string; body: (d: OnboardingDefaults) => ReactNode }[] = [
  {
    title: "First, a little about you",
    reason: "Two lines. You can change anything later.",
    body: (d) => (
      <>
        <AboutFields d={d} />
        <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug">
          <input type="checkbox" name="consent" required className="mt-0.5 size-4 shrink-0 accent-[var(--ink)]" />
          <span>
            I agree that my notes are processed to suggest posts, as the{" "}
            <Link href="/privacy" target="_blank" className="link">
              privacy notice
            </Link>{" "}
            explains. Nothing is posted for me, and I can delete everything at any time.
          </span>
        </label>
      </>
    ),
  },
  { title: "What do you want to be known for?", reason: "Pick up to three topics.", body: (d) => <TopicFields d={d} /> },
  {
    title: "What must never appear in your posts?",
    reason: "Every draft is checked against these rules before you see it.",
    body: (d) => (
      <>
        <SafetyFields d={d} />
        <FitFields d={d} />
      </>
    ),
  },
  { title: "When should we ask?", reason: "One question, once a workday.", body: (d) => <RhythmFields d={d} /> },
  {
    title: "What moved forward today?",
    reason: "A line is enough. You'll see your first wins and three ways to share them.",
    body: () => (
      <div>
        <Label htmlFor="firstWin" className="sr-only">
          What moved forward today?
        </Label>
        <Textarea
          id="firstWin"
          name="firstWin"
          className="mt-0 min-h-32"
          placeholder="Agreed the new pricing approach with the regional heads after two weeks of back and forth."
        />
        <Hint>Private. Nothing is posted without you. Leave it empty to skip for now.</Hint>
      </div>
    ),
  },
];

function SetupWizard({ defaults, action, state }: { defaults: OnboardingDefaults; action: (f: FormData) => void; state: OnboardingState }) {
  const [step, setStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const last = step === STEPS.length - 1;

  const next = () => {
    const fields = stepRefs.current[step]?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea, select",
    );
    for (const field of fields ?? []) {
      if (!field.reportValidity()) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0 });
  };

  return (
    <form data-pushed action={action} className="flex flex-1 flex-col gap-6">
      <TimeZoneField name="timezone" defaultValue={defaults.timezone} />
      <div>
        <p className="text-[13px] font-medium text-muted">
          Step {step + 1} of {STEPS.length}
        </p>
        <div className="mt-2 grid grid-cols-5 gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <span key={i} className={cx("h-1 rounded-full", i <= step ? "bg-ink" : "bg-surface-2")} />
          ))}
        </div>
      </div>

      {STEPS.map((s, i) => (
        <div
          key={s.title}
          ref={(el) => {
            stepRefs.current[i] = el;
          }}
          hidden={i !== step}
          className="flex flex-col gap-5"
        >
          <div>
            <h1 className="font-display text-display-m font-medium text-balance">{s.title}</h1>
            <p className="mt-1.5 text-[15px] text-muted">{s.reason}</p>
          </div>
          {s.body(defaults)}
        </div>
      ))}

      {state.error && <Notice tone="danger">{state.error}</Notice>}

      <div className="sticky bottom-0 -mx-4 mt-auto flex gap-2 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} aria-label="Back" className={buttonClass("secondary", "aspect-square px-0", "lg")}>
            <ArrowLeft aria-hidden />
          </button>
        )}
        {last ? (
          <SubmitButton size="lg" className="flex-1" pendingLabel="Setting up and finding your wins…">
            Finish and see my wins
          </SubmitButton>
        ) : (
          <button type="button" onClick={next} className={buttonClass("primary", "flex-1", "lg")}>
            Continue
          </button>
        )}
      </div>
    </form>
  );
}

/* ---------- Settings: the same fields on one page ---------- */

function SettingsForm({ defaults, action, state }: { defaults: OnboardingDefaults; action: (f: FormData) => void; state: OnboardingState }) {
  const sections: { id: string; title: string; hint?: string; body: ReactNode }[] = [
    { id: "about", title: "About you", body: <AboutFields d={defaults} /> },
    { id: "topics", title: "Topics and audience", body: (<><TopicFields d={defaults} /><AudienceFields d={defaults} /></>) },
    { id: "safety", title: "What never appears", hint: "Checked on every draft.", body: <SafetyFields d={defaults} /> },
    { id: "fit", title: "Personal fit", body: <FitFields d={defaults} /> },
    { id: "voice", title: "Make drafts sound more like you", hint: "Optional.", body: <VoiceFields d={defaults} /> },
    { id: "rhythm", title: "Your daily rhythm", body: <RhythmFields d={defaults} /> },
  ];
  return (
    <form data-pushed action={action} className="flex flex-col gap-6">
      <TimeZoneField name="timezone" defaultValue={defaults.timezone} />
      <input type="hidden" name="firstWin" value="" />
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-display-m font-medium">Settings</h1>
        <Link href="/account" className={buttonClass("ghost", "-mr-3 px-3", "sm")}>
          Plan, data and privacy
          <ChevronRight aria-hidden />
        </Link>
      </div>
      {sections.map((s) => (
        <Panel key={s.id} id={s.id} className="flex scroll-mt-20 flex-col gap-4">
          <div>
            <h2 className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">{s.title}</h2>
            {s.hint && <p className="mt-0.5 text-[13px] text-muted">{s.hint}</p>}
          </div>
          {s.body}
        </Panel>
      ))}
      {state.error && <Notice tone="danger">{state.error}</Notice>}
      <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <SubmitButton size="lg" className="w-full" pendingLabel="Saving…">
          Save settings
        </SubmitButton>
      </div>
    </form>
  );
}

export function OnboardingForm({ defaults, mode }: { defaults: OnboardingDefaults; mode: "setup" | "settings" }) {
  const [state, action] = useActionState<OnboardingState, FormData>(saveOnboarding, {});
  return mode === "setup" ? (
    <SetupWizard defaults={defaults} action={action} state={state} />
  ) : (
    <SettingsForm defaults={defaults} action={action} state={state} />
  );
}
