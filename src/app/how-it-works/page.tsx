import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/public-shell";
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

export default function HowItWorksPage() {
  return (
    <InfoPage
      path="/how-it-works"
      title={`How ${APP_NAME} works, and how it uses AI`}
      updated="2026-10-22"
      intro={
        <p>
          You write one line a day about your work. {APP_NAME} keeps it as a private, dated record and, only when you ask, turns your
          wins into LinkedIn drafts that are checked for confidential details, boastful phrasing and job-hunt signals. AI helps at each
          step; you approve everything, and you post it yourself.
        </p>
      }
    >
      <InfoSection title="Step by step">
        <ol className="flex flex-col gap-5">
          {STEPS.map((s) => (
            <li key={s.title} className="flex flex-col gap-2 rounded-2xl border border-border p-5">
              <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
              <p>{s.body}</p>
              <p className="rounded-xl bg-surface px-4 py-3 text-[15px]">
                <strong className="text-foreground">Where AI helps: </strong>
                {s.ai}
              </p>
            </li>
          ))}
        </ol>
      </InfoSection>

      <InfoSection id="models" title="Which AI, and what happens to your text">
        <ul>
          <li>
            We use Anthropic&apos;s Claude models, reached through OpenRouter and run on Google Vertex AI. Both are used only with zero data
            retention: your text is processed to answer and not kept.
          </li>
          <li>Only what a step needs is sent: the note being read, or the wins and settings behind a draft. Your email is never sent.</li>
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
          AI can misread a note or miss a risk. That is why every win is fact-checked against your note, every draft&apos;s facts against
          your record, and why nothing leaves {APP_NAME} without you. The checks are a careful second read, not legal, compliance or HR
          advice: read every draft as if you wrote it, because once you post it, you did.
        </p>
      </InfoSection>

      <InfoSection id="never" title="What never happens">
        <ul>
          <li>{APP_NAME} never logs in to, reads, scrapes or automates your LinkedIn account. There is no browser extension.</li>
          <li>It never posts, comments, likes or messages for you.</li>
          <li>It never invents achievements, numbers or quotes.</li>
          <li>It never adds labels, tags or links to what you post.</li>
        </ul>
      </InfoSection>
    </InfoPage>
  );
}
