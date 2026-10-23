import type { Metadata } from "next";
import { InfoSection as Section, PublicPage } from "@/components/public-shell";
import { APP_NAME, PRIVACY_EMAIL, PRIVACY_NOTICE_VERSION } from "@/lib/config/app";
import { OPERATOR } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: `How ${APP_NAME} handles your notes and the people in your network: stored in Mumbai, never sold or shared, never used to train AI, deletable at any time.`,
  alternates: { canonical: "/privacy" },
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

const versionDate = new Date(`${PRIVACY_NOTICE_VERSION}T00:00:00Z`).toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default function PrivacyPage() {
  return (
    <PublicPage
      path="/privacy"
      title="Privacy notice"
      intro="You write down work that matters to you, often about people and clients who never agreed to be online. We treat it that way."
      meta={
        <p className="t-caption">Version of {versionDate}</p>
      }
    >

      <Section title="Who we are">
        <p>
          {APP_NAME} is operated {OPERATOR.legalName ? `by ${OPERATOR.legalName}` : "by its founder"}
          {OPERATOR.address ? `, ${OPERATOR.address}` : ", in India"}. Our data protection contact, who is also our grievance officer,
          is {OPERATOR.founderName ?? `the founder of ${APP_NAME}`}, at{" "}
          <a href={`mailto:${PRIVACY_EMAIL}`} className="link">
            {PRIVACY_EMAIL}
          </a>
          . We acknowledge every complaint within 24 hours and resolve it within 15 days.
        </p>
      </Section>

      <Section title="What we never do">
        <ul>
          <li>Log in to, read or automate your LinkedIn account, or post or send anything for you.</li>
          <li>Sell, rent or share what you write, or the people you add to your network.</li>
          <li>Look people up, scrape profiles, buy contact data, or add to your contacts from any other source.</li>
          <li>Use your notes, wins, drafts, network or style notebook to train AI models, ours or anyone else&apos;s.</li>
          <li>Send people&apos;s names, or your never-mention terms, to an AI company.</li>
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
          <strong>Your network:</strong> your answers about the role you&apos;d want next (function, sectors, level, countries,
          competitors and companies you&apos;d join), the people and firms you add, what you note about them, your conversation log,
          next steps and the roles you track. To suggest search firms and roles worth knowing, remind you of follow-ups and write
          messages for you to send.
        </p>
        <p>
          <strong>Your style notebook:</strong> short notes about how you write (&ldquo;says &lsquo;we&rsquo; for team
          results&rdquo;, &ldquo;no emojis&rdquo;), learned from your sample posts and from the changes you make before posting.
          Style only, never what your posts say. Used only for your drafts; see, change or clear it in Settings → How you write.
        </p>
        <p>
          <strong>Search index:</strong> for each win, a list of numbers that describes what it is about, made by a model on our
          own server. It lets you search your record by meaning and matches your best evidence to a role. Kept with your wins and
          deleted with them.
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

      <Section title="People in your network">
        <p>
          The people you add are typed in by you: a name, their role and organisation, and anything you choose to note, such as an
          email address or a profile link. We keep it only so you can manage your own professional relationships. It is never shared,
          never combined with data from other sources, and never used to contact anyone; {APP_NAME} sends nothing to them.
        </p>
        <p>
          When you ask for a message, the AI sees the person&apos;s role, organisation and your notes, with their name replaced by a
          placeholder. Their name is filled in afterwards, on our server. Please add only people you have a genuine professional
          reason to contact, and only what you need. If someone asks us about data a user holds about them, we pass the request to
          that user, who controls it, and help where the law requires.
        </p>
        <p>
          The search firm directory holds firm-level facts from each firm&apos;s own website, and no personal data.
        </p>
      </Section>

      <Section title="Where your data is, and who helps us">
        <p>
          Your data is stored on our own server in Mumbai, India, with encrypted nightly backups. To read a note or write a draft, the
          text is sent to an AI model host under zero-data-retention terms: it is processed and not kept. That host may be outside
          your country.
        </p>
        <p>
          Before anything is sent, a model we run on our own server replaces people&apos;s names, including yours and the people
          in your network, and your never-mention terms with placeholders such as &ldquo;[Person 1]&rdquo;. Names are put back only
          in what you see; never-mention terms are not put back at all. If that check can&apos;t run, nothing is sent. No model is
          perfect: in our tests on names it had not seen before, it caught 47 of 48, and the AI is also told to refer to people by
          role and never to guess a name.
        </p>
        <div className="overflow-x-auto">
          <table className="table-site min-w-[30rem]">
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">What it does</th>
                <th scope="col">Where</th>
              </tr>
            </thead>
            <tbody>
              {SUBPROCESSORS.map((s) => (
                <tr key={s.name}>
                  <th scope="row">{s.name}</th>
                  <td>{s.role}</td>
                  <td>{s.where}</td>
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
        <ul>
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
        <p>
          23 October 2026: added your network (the people and firms you add, your conversations and roles) and how we handle data
          about the people in it; names and never-mention terms are now removed on our server before anything reaches the AI; and
          a search index of your wins, made on our server.
        </p>
        <p>
          22 October 2026: added who runs {APP_NAME} and how to reach our grievance officer. No change to how we use your data.
        </p>
      </Section>
    </PublicPage>
  );
}
