import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PublicPage } from "@/components/public-shell";
import { PostChecker } from "./checker";

export const metadata: Metadata = {
  title: "Free LinkedIn post check: is it OK to post this?",
  description:
    "Paste a LinkedIn draft and see what could get you in trouble at work: client names, precise figures, things not yet public, job-hunting signals and clichés. Free, no sign-up, nothing stored.",
  alternates: { canonical: "/check" },
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
    <PublicPage
      path="/check"
      title="Is it OK to post this?"
      intro="Paste your LinkedIn draft. See what could cause trouble at work before anyone else does. Free, no sign-up, nothing stored."
      meta={
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-muted">
          {["Runs in your browser", "Nothing is sent or stored", "No sign-up"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check aria-hidden className="size-4 text-foreground" strokeWidth={2.25} />
              {t}
            </li>
          ))}
        </ul>
      }
    >
      <PostChecker />
      <section className="flex flex-col gap-6">
        <h2 className="t-h3">Common questions</h2>
        <dl className="border-t border-border">
          {QUESTIONS.map(({ q, a }) => (
            <div key={q} className="flex flex-col gap-1.5 border-b border-border py-5">
              <dt className="t-title">{q}</dt>
              <dd className="t-body text-muted">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </PublicPage>
  );
}
