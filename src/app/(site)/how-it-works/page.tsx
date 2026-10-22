import type { Metadata } from "next";
import Link from "next/link";
import { Hand, LockKeyhole, ShieldCheck, Unplug } from "lucide-react";
import { AsideCard, InfoPage, InfoSection } from "@/components/public-shell";
import { APP_NAME } from "@/lib/config/app";

export const metadata: Metadata = {
  title: "How it works and how we use AI",
  description: `How ${APP_NAME} turns a one-line daily note into a private work record and checked LinkedIn drafts: which steps use AI, which models, what is sent, and what never happens.`,
  alternates: { canonical: "/how-it-works" },
};

const STEPS: { title: string; body: string; ai: string }[] = [
  {
    title: "1. You note what you did",
    body: "One line a day, typed or spoken. Unless you turn it off, other people's names are replaced by roles before the note is saved.",
    ai: "AI picks out the wins in your note (what you did, the result, the skills involved). A second pass fact-checks each win against your note and removes anything you didn't say.",
  },
  {
    title: "2. Your record builds itself",
    body: "Wins are kept by date and topic. From the same record you get appraisal summaries, CV and profile suggestions, and a weekly look back.",
    ai: "Profile and CV suggestions are drafted by AI from your wins and checked like a post.",
  },
  {
    title: "3. You ask for ways to share a win",
    body: "Ideas and drafts come only when you ask. Each draft is built only from the wins behind it.",
    ai: "AI writes three drafts with different leanings, then an editor pass picks the most useful one. Your style notebook (how you write, learned from your samples and edits) shapes the voice.",
  },
  {
    title: "4. Every draft is checked before you see it",
    body: "Automatic rules look for your never-mention terms, client names, exact figures, job-hunt phrases and clichés.",
    ai: "An AI review checks that every specific fact is in your record, and looks for confidential details, job-hunt signals, your no-go topics and credit taken from others, fixing what fails. A second review predicts how a peer, your leadership and a client or recruiter would read it.",
  },
  {
    title: "5. You decide",
    body: "Edit anything, ask for it shorter or more modest, or discard it. To post, you copy it, open LinkedIn yourself and paste.",
    ai: `Nothing is posted, sent or shared by ${APP_NAME}. It has no access to LinkedIn.`,
  },
];

const NEVER = [
  `${APP_NAME} never logs in to, reads, scrapes or automates your LinkedIn account. There is no browser extension.`,
  "It never posts, comments, likes or messages for you.",
  "It never invents achievements, numbers or quotes.",
  "It never adds labels, tags or links to what you post.",
];

export default function HowItWorksPage() {
  return (
    <InfoPage
      path="/how-it-works"
      title={`How ${APP_NAME} works, and how it uses AI`}
      updated="2026-10-22"
      aside={
        <AsideCard
          title="At a glance"
          items={[
            { icon: Hand, text: "You approve everything; nothing goes out without you" },
            { icon: ShieldCheck, text: "Every draft's facts are checked against your record" },
            { icon: LockKeyhole, text: "Claude models with zero data retention" },
            { icon: Unplug, text: "No access to LinkedIn, no browser extension" },
          ]}
        />
      }
      intro={
        <p>
          You write one line a day about your work. {APP_NAME} keeps it as a private, dated record and, only when you ask, turns
          your wins into LinkedIn drafts that are checked for confidential details, boastful phrasing and job-hunt signals. AI
          helps at each step; you approve everything, and you post it yourself.
        </p>
      }
    >
      <InfoSection title="Step by step">
        <ol className="!list-none !pl-0 border-t border-border">
          {STEPS.map((s, i) => (
            <li key={s.title} className="!mt-0 grid gap-x-6 gap-y-3 border-b border-border py-7 sm:grid-cols-[2rem_1fr]">
              <span className="tnum pt-0.5 text-[17px] font-semibold text-muted">{i + 1}</span>
              <div className="flex min-w-0 flex-col gap-3">
                <h3 className="t-title">{s.title.replace(/^\d+\.\s*/, "")}</h3>
                <p className="text-muted">{s.body}</p>
                <p className="rounded-lg bg-surface px-4 py-3 text-[16px] leading-relaxed">
                  <strong>Where AI helps.</strong> {s.ai}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </InfoSection>

      <InfoSection id="models" title="Which AI, and what happens to your text">
        <ul>
          <li>
            We use Anthropic&apos;s Claude models, reached through OpenRouter and run on Google Vertex AI. Both are used only with
            zero data retention: your text is processed to answer and not kept.
          </li>
          <li>
            Only what a step needs is sent: the note being read, or the wins and settings behind a draft. Your email is never
            sent.
          </li>
          <li>Your notes, wins, drafts and style notebook are never used to train any AI model, ours or anyone else&apos;s.</li>
          <li>
            The free post check on this site uses rules only, runs in your browser and sends nothing anywhere.{" "}
            <Link href="/check" className="link">
              Try it
            </Link>
            .
          </li>
        </ul>
      </InfoSection>

      <InfoSection id="limits" title="What AI can get wrong">
        <p>
          AI can misread a note or miss a risk. That is why every win is fact-checked against your note, every draft&apos;s facts
          against your record, and why nothing leaves {APP_NAME} without you. The checks are a careful second read, not legal,
          compliance or HR advice: read every draft as if you wrote it, because once you post it, you did.
        </p>
      </InfoSection>

      <InfoSection id="never" title="What never happens">
        <ul>
          {NEVER.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </InfoSection>
    </InfoPage>
  );
}
