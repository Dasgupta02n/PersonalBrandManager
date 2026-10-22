import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, ScanSearch, ShieldCheck } from "lucide-react";
import { AsideCard, InfoPage, InfoSection, JsonLd } from "@/components/public-shell";
import { APP_NAME } from "@/lib/config/app";
import { ABOUT_POSTING, ABOUT_WINWALL, faqPageJsonLd, type Faq } from "@/lib/content/site-faq";

export const metadata: Metadata = {
  title: "Questions and answers: LinkedIn at work, and Winwall",
  description:
    "Is it safe to post about your company on LinkedIn? Can you mention a client? Will your employer see? Plain answers for employed professionals, and how Winwall works.",
  alternates: { canonical: "/faq" },
};

function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.id} id={item.id} className="card flex scroll-mt-24 flex-col gap-2 p-6">
          <h3 className="font-heading text-[19px] tracking-[-0.02em] text-foreground">{item.q}</h3>
          <p className="text-[16px] leading-relaxed">{item.a}</p>
        </div>
      ))}
    </div>
  );
}

export default function FaqPage() {
  return (
    <InfoPage
      path="/faq"
      title="Questions and answers"
      updated="2026-10-22"
      aside={
        <AsideCard
          title="On this page"
          items={[
            { icon: Briefcase, text: <a href="#posting" className="hover:text-brass">Posting on LinkedIn while employed</a> },
            { icon: ShieldCheck, text: <a href="#winwall" className="hover:text-brass">About {APP_NAME}</a> },
          ]}
          action={
            <Link href="/check" className="btn btn-gold w-full">
              <ScanSearch aria-hidden />
              Check a post free
            </Link>
          }
        />
      }
      intro={
        <p>
          Plain answers to what employed professionals ask about posting on LinkedIn, and about how {APP_NAME} works. Want to check a
          specific post?{" "}
          <Link href="/check" className="link">
            Use the free post check
          </Link>
          .
        </p>
      }
    >
      <InfoSection id="posting" title="Posting on LinkedIn while employed">
        <FaqList items={ABOUT_POSTING} />
      </InfoSection>
      <InfoSection id="winwall" title={`About ${APP_NAME}`}>
        <FaqList items={ABOUT_WINWALL} />
      </InfoSection>
      <p className="text-[15px] text-muted">
        These answers are general guidance, not legal advice. Your contract, your employer&apos;s policies and the rules of your industry
        come first.
      </p>
      <JsonLd data={faqPageJsonLd([...ABOUT_POSTING, ...ABOUT_WINWALL])} />
    </InfoPage>
  );
}
