import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection, JsonLd } from "@/components/public-shell";
import { APP_NAME } from "@/lib/config/app";
import { FACTS, OPERATOR, SITE_URL, absoluteUrl, operatorLine } from "@/lib/config/site";

export const metadata: Metadata = {
  title: `About ${APP_NAME}: who makes it and why`,
  description: `Who runs ${APP_NAME}, why it exists, what it will never do, and how it makes money.`,
  alternates: { canonical: "/about" },
};

const WONT = [
  { title: "Post or message for you", body: "We have no access to LinkedIn or your email and never will. You approve, post and send everything." },
  { title: "Look people up", body: "No scraping, no bought contact lists, no guessing who works where. Your network is the people you add." },
  { title: "Invent facts", body: "Drafts use only what you logged, and every specific fact is checked against your record." },
  { title: "Sell or train on your words", body: "Never sold, never used to train AI. You can export or delete everything." },
  { title: "Chase followers", body: "No growth hacks, follower targets or streaks. Quality over frequency." },
  { title: "Take money from search firms", body: "No firm pays to be listed, ranked or introduced to you. The directory serves you, not them." },
];

export default function AboutPage() {
  const aboutPage = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: absoluteUrl("/about"),
    about: { "@id": `${SITE_URL}/#organization` },
    ...(OPERATOR.founderName
      ? {
          mainEntity: {
            "@type": "Person",
            name: OPERATOR.founderName,
            jobTitle: "Founder",
            worksFor: { "@id": `${SITE_URL}/#organization` },
            ...(OPERATOR.linkedin ? { sameAs: [OPERATOR.linkedin] } : {}),
          },
        }
      : {}),
  };

  return (
    <InfoPage
      path="/about"
      title={`About ${APP_NAME}`}
      updated="2026-10-23"
      intro={
        <p>
          {APP_NAME} helps senior professionals get ready for the next role without looking as if they&apos;re looking: a private
          record of their work, a careful second reader for LinkedIn, and a private network of the search firms and people who bring
          the next role. It is made by {operatorLine()}, and is in private beta.
        </p>
      }
      aside={
        OPERATOR.founderName ? (
          <div className="flex flex-col gap-2 rounded-xl border border-border p-6">
            <p className="t-title">{OPERATOR.founderName}</p>
            <p className="text-muted">Founder{OPERATOR.city ? ` · ${OPERATOR.city}, India` : ""}</p>
            {OPERATOR.linkedin && (
              <a href={OPERATOR.linkedin} className="link font-semibold" rel="me">
                {OPERATOR.founderName} on LinkedIn
              </a>
            )}
          </div>
        ) : undefined
      }
    >
      <InfoSection title="Why it exists">
        <p>
          The people who do the best work often talk about it least. Ask them why and the reasons are the same: they don&apos;t want to
          sound boastful, leak something confidential, look as if they&apos;re job hunting, or be seen using AI. And by appraisal time,
          half of what they did is forgotten.
        </p>
        <p>
          {APP_NAME} makes the careful thing the easy thing. Note one line a day and your record builds itself. When you want to share
          something, every draft comes from your real work and is checked before you see it. You decide what, if anything, goes out.
        </p>
        <p>
          The same people rarely look for their next role in public, and shouldn&apos;t have to. Senior roles mostly come through
          search firms and people who already know your work. So {APP_NAME} also helps you find the firms that place people like you,
          know who matters at your competitors, and keep those relationships warm, privately and in your own words.
        </p>
      </InfoSection>

      <InfoSection title="What we won't do">
        <div className="grid border-t border-border sm:grid-cols-2 sm:gap-x-10">
          {WONT.map((w) => (
            <div key={w.title} className="!mt-0 border-b border-border py-5">
              <h3 className="mb-1 font-semibold">{w.title}</h3>
              <p>{w.body}</p>
            </div>
          ))}
        </div>
        <p>
          <strong className="text-foreground">How we make money:</strong> you pay us; no one else does. No ads, no data sales, no
          employer plans, no fees from search firms.
        </p>
      </InfoSection>

      <InfoSection id="facts" title={`${APP_NAME} in brief`}>
        <dl className="grid border-t border-border sm:grid-cols-2 sm:gap-x-10">
          {FACTS.map((f) => (
            <div key={f.label} className="!mt-0 border-b border-border py-4">
              <dt className="font-semibold text-foreground">{f.label}</dt>
              <dd className="mt-0.5 text-muted">{f.value}</dd>
            </div>
          ))}
        </dl>
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/security" className="link font-semibold">
            How we protect your data
          </Link>
          <Link href="/contact" className="link font-semibold">
            Contact us
          </Link>
        </p>
      </InfoSection>
      <JsonLd data={aboutPage} />
    </InfoPage>
  );
}
