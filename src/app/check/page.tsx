import type { Metadata } from "next";
import { PublicPage } from "@/components/public-shell";
import { PostChecker } from "./checker";

export const metadata: Metadata = {
  title: "Free LinkedIn post check: is it OK to post this?",
  description:
    "Paste a LinkedIn draft and see what could get you in trouble at work: client names, precise figures, things not yet public, job-hunting signals and clichés. Free, no sign-up, nothing stored.",
};

const QUESTIONS = [
  {
    q: "Is it OK to post about a client win on LinkedIn?",
    a: "Only with the client's permission, or described so they can't be identified (“a large retailer”). Check your contract and your company's social media policy too.",
  },
  {
    q: "Can I share revenue or growth numbers?",
    a: "Usually not exact internal figures. Rounded or relative numbers (“doubled”, “about a third”) are safer, and only once they're public or approved.",
  },
  {
    q: "Will my manager mind?",
    a: "Posts that credit the team, explain a decision or share a lesson rarely cause trouble. Taking sole credit, hinting at internal disagreement or sounding like you're job hunting often does.",
  },
];

export default function CheckPage() {
  return (
    <PublicPage>
      <header>
        <h1 className="font-display text-display-l font-medium text-balance">Is it OK to post this?</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">
          Paste your LinkedIn draft. See what could cause trouble at work before anyone else does. Free, no sign-up, nothing stored.
        </p>
      </header>
      <PostChecker />
      <section className="flex flex-col gap-5 border-t border-border pt-8">
        <h2 className="font-display text-display-m font-medium">Common questions</h2>
        <dl className="flex flex-col gap-5">
          {QUESTIONS.map(({ q, a }) => (
            <div key={q}>
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 leading-relaxed text-muted">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </PublicPage>
  );
}
