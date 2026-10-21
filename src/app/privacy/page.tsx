import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PublicPage } from "@/components/public-shell";
import { APP_NAME, PRIVACY_EMAIL, PRIVACY_NOTICE_VERSION } from "@/lib/config/app";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: `How ${APP_NAME} handles your notes: stored in Mumbai, never sold, never used to train AI, deletable at any time.`,
};

const SUBPROCESSORS = [
  {
    name: "Hostinger",
    role: "Runs our server (the app and its database) and sends sign-in emails",
    where: "Mumbai, India. Hostinger's weekly server backups are kept outside India (Malaysia)",
  },
  { name: "Google Drive", role: "Keeps encrypted copies of our nightly backups", where: "Encrypted before upload: Google can't read them" },
  { name: "OpenRouter", role: "Routes AI requests to the model host", where: "Zero data retention" },
  { name: "Google Cloud Vertex AI", role: "Runs the Claude model that reads your notes", where: "Zero data retention; may be outside India" },
  { name: "Paddle", role: "Payments and sales tax, when billing opens", where: "Card details never reach us" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex flex-col gap-2.5 text-[15px] leading-relaxed text-muted [&_strong]:text-foreground">{children}</div>
    </section>
  );
}

const versionDate = new Date(`${PRIVACY_NOTICE_VERSION}T00:00:00Z`).toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default function PrivacyPage() {
  return (
    <PublicPage>
      <header>
        <p className="text-[13px] font-medium text-muted">Version of {versionDate}</p>
        <h1 className="mt-1 font-display text-display-l font-medium">Privacy notice</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">
          You write down work that matters to you, often about people and clients who never agreed to be online. We treat it that
          way.
        </p>
      </header>

      <Section title="What we never do">
        <ul className="list-disc pl-5">
          <li>Log in to, read or automate your LinkedIn account, or post anything for you.</li>
          <li>Sell, rent or share what you write.</li>
          <li>Use your notes, wins, drafts or style notebook to train AI models, ours or anyone else&apos;s.</li>
          <li>Show you ads or track you across other sites.</li>
        </ul>
      </Section>

      <Section title="What we collect, and why">
        <p>
          <strong>Your account:</strong> your email address. Sign-in is by a one-time code or link sent to it; there is no password.
          To sign you in.
        </p>
        <p>
          <strong>Your settings:</strong> your role, topics, tone, employer rules, never-mention list and no-go topics. To check
          every draft against them.
        </p>
        <p>
          <strong>Your record:</strong> the notes you write, the wins drawn from them, drafts, opportunities you log and profile
          suggestions. To suggest posts, keep your record and prepare your profile, CV and appraisal summaries.
        </p>
        <p>
          <strong>Your style notebook:</strong> short notes about how you write (&ldquo;says &lsquo;we&rsquo; for team
          results&rdquo;, &ldquo;no emojis&rdquo;), learned from your sample posts and from the changes you make before posting.
          Style only, never what your posts say. Used only for your drafts; see, change or clear it in Settings → How you write.
        </p>
        <p>
          <strong>Usage records:</strong> which AI step ran, its token count and cost. No content. To keep each plan within its
          fair-use allowance. We also count how features are used, as totals with none of your text, to improve the product.
        </p>
        <p>
          We process this to provide the service you asked for, with your consent, which you give when you set up your account.
        </p>
      </Section>

      <Section title="Other people's names">
        <p>
          Your notes may mention colleagues and clients. With &ldquo;Keep other people&apos;s names out of my record&rdquo; on (the
          default), names are replaced by roles before a note is saved, and terms on your never-mention list are never stored in
          notes.
        </p>
      </Section>

      <Section title="Where your data is, and who helps us">
        <p>
          Your data is stored on our own server in Mumbai, India, with encrypted nightly backups. To read a note or write a draft, the text is sent to an AI model host under
          zero-data-retention terms: it is processed and not kept. That host may be outside your country.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-sm">
            <thead className="text-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-semibold">Service</th>
                <th className="py-2 pr-3 font-semibold">What it does</th>
                <th className="py-2 font-semibold">Where</th>
              </tr>
            </thead>
            <tbody>
              {SUBPROCESSORS.map((s) => (
                <tr key={s.name} className="border-b border-border">
                  <td className="py-2 pr-3 font-medium text-foreground">{s.name}</td>
                  <td className="py-2 pr-3">{s.role}</td>
                  <td className="py-2">{s.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="How long we keep it">
        <p>
          Until you delete it, or your account. Deleting your account removes your data from our database straight away; database
          backups roll off within 30 days. Usage records are kept for accounting without anything that identifies you.
        </p>
      </Section>

      <Section title="Your rights">
        <ul className="list-disc pl-5">
          <li>
            <strong>See and download</strong> everything: Settings → Plan, data and privacy → Download everything.
          </li>
          <li>
            <strong>Correct</strong> anything by editing it in the app.
          </li>
          <li>
            <strong>Delete</strong> your account and everything in it, at any time, from the same page. This also withdraws your
            consent.
          </li>
          <li>
            <strong>Nominate</strong> someone to exercise these rights for you, and <strong>complain</strong> to us or to your
            data protection authority (in India, the Data Protection Board; in the UK, the ICO).
          </li>
        </ul>
        <p>
          Email{" "}
          <a href={`mailto:${PRIVACY_EMAIL}`} className="link">
            {PRIVACY_EMAIL}
          </a>{" "}
          for anything here. We reply within 30 days.
        </p>
      </Section>

      <Section title="If something goes wrong">
        <p>
          If a breach affects your data, we tell you and the relevant authorities without undue delay, as the law in your country
          requires.
        </p>
      </Section>

      <Section title="Changes and age">
        <p>
          {APP_NAME} is for professionals aged 18 and over. If this notice changes in a way that matters, we&apos;ll ask you to agree
          again before you continue.
        </p>
      </Section>
    </PublicPage>
  );
}
