import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/public-shell";
import { APP_NAME } from "@/lib/config/app";
import { CONTACT, OPERATOR } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Contact us and our grievance officer",
  description: `How to reach ${APP_NAME}: questions, privacy requests, security reports and complaints, with our grievance officer's details and response times.`,
  alternates: { canonical: "/contact" },
};

const CHANNELS = [
  { title: "Questions and help", email: CONTACT.hello, body: "The product, the beta, billing." },
  { title: "Privacy and your data", email: CONTACT.privacy, body: "Access, correction, deletion, consent. Our data protection contact." },
  { title: "Security", email: CONTACT.security, body: "Report a vulnerability, with “Security” in the subject." },
];

export default function ContactPage() {
  return (
    <InfoPage
      path="/contact"
      title="Contact us"
      updated="2026-10-22"
      intro={<p>Write to us and a person replies, usually within one working day. There&apos;s no chatbot and no ticket queue.</p>}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map((c) => (
          <div key={c.title} className="flex flex-col gap-1.5 rounded-2xl bg-surface p-5">
            <h2 className="font-semibold">{c.title}</h2>
            <a href={`mailto:${c.email}`} className="link text-[17px] font-semibold break-all">
              {c.email}
            </a>
            <p className="text-[15px] text-foreground/80">{c.body}</p>
          </div>
        ))}
      </div>

      <InfoSection id="grievance" title="Grievance officer">
        <p>
          If something has gone wrong with your data or our service, our grievance officer handles it personally. We acknowledge every
          complaint within <strong className="text-foreground">24 hours</strong> and resolve it within{" "}
          <strong className="text-foreground">15 days</strong>.
        </p>
        <dl className="grid gap-x-8 gap-y-3 rounded-2xl border border-border p-5 sm:grid-cols-2">
          <div>
            <dt className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Name</dt>
            <dd className="text-foreground">{OPERATOR.founderName ?? `The founder of ${APP_NAME}`}</dd>
          </div>
          <div>
            <dt className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Role</dt>
            <dd className="text-foreground">Founder and grievance officer</dd>
          </div>
          <div>
            <dt className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Email</dt>
            <dd>
              <a href={`mailto:${CONTACT.privacy}?subject=Grievance`} className="link">
                {CONTACT.privacy}
              </a>{" "}
              (subject &ldquo;Grievance&rdquo;)
            </dd>
          </div>
          <div>
            <dt className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Post</dt>
            <dd className="text-foreground">{OPERATOR.address ?? "India. We'll publish a postal address before payments open."}</dd>
          </div>
        </dl>
      </InfoSection>

      <InfoSection id="operator" title="Who you're dealing with">
        <p>
          {APP_NAME} is operated {OPERATOR.legalName ? `by ${OPERATOR.legalName}` : "by its founder"}
          {OPERATOR.address ? `, ${OPERATOR.address}` : ", in India"}. After the beta, payments are handled by Paddle as our merchant of
          record.
        </p>
        <p>
          If you&apos;re not satisfied with our answer, you can also complain to a data protection authority: in India, the Data
          Protection Board; in the UK, the Information Commissioner&apos;s Office; in the EU, your local authority.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
