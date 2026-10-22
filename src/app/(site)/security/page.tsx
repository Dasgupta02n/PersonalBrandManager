import type { Metadata } from "next";
import { DatabaseBackup, EyeOff, KeyRound, LockKeyhole, MapPin } from "lucide-react";
import { AsideCard, InfoPage, InfoSection } from "@/components/public-shell";
import { APP_NAME } from "@/lib/config/app";
import { CONTACT } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Security: how we protect your notes",
  description: `Exactly how ${APP_NAME} protects your work notes: stored in Mumbai, India, zero-retention AI, no passwords, encrypted backups, and what we don't have yet.`,
  alternates: { canonical: "/security" },
};

const WHERE: { what: string; where: string; who: string; howLong: string }[] = [
  { what: "Your notes, wins, drafts and settings", where: "Our server, Mumbai, India", who: "Only you", howLong: "Until you delete them" },
  { what: "Your account (email address only)", where: "Our server, Mumbai", who: "Used only to sign you in", howLong: "Until you delete your account" },
  { what: "Text sent for drafting or checks", where: "OpenRouter, then Google Vertex AI", who: "Processed, not kept", howLong: "Zero data retention" },
  { what: "Backups", where: "Our server and Google Drive", who: "Encrypted; only we hold the key", howLong: "14 days on the server, 30 on Drive" },
  { what: "Weekly server snapshots", where: "Hostinger, Malaysia", who: "Our host, for disaster recovery", howLong: "Hostinger's schedule" },
  { what: "Card details (after the beta)", where: "Paddle", who: "Paddle only", howLong: "They never reach us" },
];

export default function SecurityPage() {
  return (
    <InfoPage
      path="/security"
      title={`Security at ${APP_NAME}`}
      updated="2026-10-22"
      aside={
        <AsideCard
          title="At a glance"
          items={[
            { icon: MapPin, text: "Your notes stay on our own server in Mumbai, India" },
            { icon: LockKeyhole, text: "AI with zero data retention; never used for training" },
            { icon: KeyRound, text: "No passwords: one-time codes, stored only as hashes" },
            { icon: DatabaseBackup, text: "Nightly backups encrypted with AES-256" },
            { icon: EyeOff, text: "No ad pixels, no trackers, no LinkedIn access" },
          ]}
        />
      }
      intro={
        <p>
          {APP_NAME} is run by one founder, so we don&apos;t have SOC 2 or ISO 27001 certification yet. Instead, here is exactly what
          we do to protect your notes, written so you can check every claim.
        </p>
      }
    >
      <InfoSection id="where" title="Where your data is">
        <div className="overflow-x-auto">
          <table className="table-site min-w-[640px]">
            <thead>
              <tr>
                {["What", "Where", "Who can read it", "How long"].map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WHERE.map((row) => (
                <tr key={row.what}>
                  <th scope="row">
                    {row.what}
                  </th>
                  <td>{row.where}</td>
                  <td>{row.who}</td>
                  <td>{row.howLong}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoSection>

      <InfoSection id="account" title="Your account">
        <ul>
          <li>
            No password to leak. You sign in with a 6-digit code or a link we email you. It works once and expires in 15 minutes; five
            wrong codes lock it.
          </li>
          <li>We store codes, links and session tokens only as keyed hashes. A copy of our database alone can&apos;t be used to sign in.</li>
          <li>Signing out ends the session on our side, so a copied cookie stops working too.</li>
        </ul>
      </InfoSection>

      <InfoSection id="database" title="The database">
        <ul>
          <li>It has no public address: it sits on a private network with no internet access.</li>
          <li>
            The app&apos;s own login has no rights of its own. Every request runs as the signed-in person, and row-level security limits
            it to their records.
          </li>
          <li>Its passwords are generated on the server itself. No person types or sees them.</li>
          <li>Only the founder can access the production server.</li>
        </ul>
      </InfoSection>

      <InfoSection id="encryption" title="Encryption, precisely">
        <ul>
          <li>In transit: HTTPS everywhere.</li>
          <li>Backups: encrypted with AES-256 before they are written; the key is kept offline.</li>
          <li>Live data on the server is protected by the access controls above, not by separate disk encryption.</li>
          <li>Hostinger&apos;s weekly server snapshots are not encrypted by us.</li>
        </ul>
      </InfoSection>

      <InfoSection id="ai" title="AI and your words">
        <ul>
          <li>Only the text a task needs is sent: the note you&apos;re turning into wins, or the wins behind a draft.</li>
          <li>
            We use Claude models through OpenRouter and Google Vertex AI with zero data retention. Your words are never used to train any
            AI.
          </li>
          <li>The free post check runs entirely in your browser and sends nothing to us.</li>
          <li>{APP_NAME} never logs in to LinkedIn, has no browser extension and automates nothing.</li>
          <li>Our logs never contain your notes or drafts. Usage records keep only the task, model and cost.</li>
        </ul>
      </InfoSection>

      <InfoSection id="deletion" title="Deleting your data">
        <p>
          Deleting your account removes everything from our database immediately. Encrypted backups cycle out within 30 days, and
          Hostinger&apos;s snapshots on their own schedule. You can download everything first, in one file.
        </p>
      </InfoSection>

      <InfoSection id="incidents" title="If something goes wrong">
        <p>
          If your data is ever exposed, we will tell you directly and notify regulators as each law requires, within 72 hours where GDPR
          applies.
        </p>
      </InfoSection>

      <InfoSection id="report" title="Report a vulnerability">
        <p>
          Email{" "}
          <a href={`mailto:${CONTACT.security}?subject=Security`} className="link">
            {CONTACT.security}
          </a>{" "}
          with &ldquo;Security&rdquo; in the subject. We reply within two working days and won&apos;t take action against good-faith
          research. Our <a href="/.well-known/security.txt" className="link">security.txt</a> file lists the same contact.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
