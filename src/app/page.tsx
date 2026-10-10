import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { APP_NAME, APP_TAGLINE } from "@/lib/config/app";

const steps = [
  {
    title: "Tell it what you did",
    body: "One question every evening. Reply in a line or a voice note. About a minute.",
  },
  {
    title: "Get posts in your voice",
    body: "Daily post ideas and drafts built from your real work, plus comments for the conversations worth joining.",
  },
  {
    title: "Stay current, every week",
    body: "Your LinkedIn profile and CV are refreshed from what you achieved. You approve every change.",
  },
  {
    title: "See it working",
    body: "A weekly scorecard: the opportunities that came to you, your consistency and your reach.",
  },
];

const promises = [
  "Nothing is posted without your tap",
  "Never signals that you're job hunting",
  "Keeps your employer's confidential details out",
  "Your data is never sold or shared",
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-4 py-10 sm:py-16">
      <nav className="flex items-center justify-between">
        <span className="text-lg font-bold">{APP_NAME}</span>
        <Link href="/login" className={buttonClass("secondary")}>
          Sign in
        </Link>
      </nav>

      <section className="flex flex-col gap-5">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">{APP_TAGLINE}</h1>
        <p className="max-w-2xl text-lg text-muted">
          Your personal brand manager. One minute a day turns your real achievements into LinkedIn posts,
          conversations and a profile that stays current, so opportunities come to you.
        </p>
        <div>
          <Link href="/login" className={buttonClass("primary")}>
            Get started
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {steps.map((step, i) => (
          <div key={step.title} className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-semibold text-accent">Step {i + 1}</p>
            <h2 className="mt-1 text-lg font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm text-muted">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">What it never does</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {promises.map((p) => (
            <li key={p} className="flex gap-2">
              <span aria-hidden className="text-success">✓</span>
              {p}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
