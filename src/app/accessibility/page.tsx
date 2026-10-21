import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/public-shell";
import { APP_NAME } from "@/lib/config/app";
import { CONTACT } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Accessibility",
  description: `${APP_NAME}'s accessibility commitment: what we've done towards WCAG 2.2 AA, what we haven't tested yet, and how to tell us about a barrier.`,
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <InfoPage
      path="/accessibility"
      title="Accessibility"
      updated="2026-10-22"
      intro={
        <p>
          We want {APP_NAME} to work for everyone, and we aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. We
          haven&apos;t had an independent audit yet; here is what we&apos;ve done and how to tell us when something doesn&apos;t work.
        </p>
      }
    >
      <InfoSection title="What we've done">
        <ul>
          <li>Text and background colours meet at least the WCAG AA contrast ratio, in light and dark mode.</li>
          <li>Buttons are at least 44 pixels tall, so they&apos;re easy to tap.</li>
          <li>Pages are built to work with a keyboard alone, with a visible focus outline.</li>
          <li>Icons that carry meaning have text labels, and status is never shown by colour alone.</li>
          <li>Pages use real headings, lists, tables and form labels, so screen readers can navigate them.</li>
          <li>Layouts adapt to narrow screens and larger text sizes.</li>
        </ul>
      </InfoSection>
      <InfoSection title="What we know isn't perfect yet">
        <ul>
          <li>We have checked colour contrast with automated tools, but haven&apos;t yet tested every page with screen readers.</li>
          <li>Voice dictation in the app depends on your browser&apos;s speech recognition, which some browsers don&apos;t offer.</li>
        </ul>
      </InfoSection>
      <InfoSection title="Tell us about a barrier">
        <p>
          Email{" "}
          <a href={`mailto:${CONTACT.hello}?subject=Accessibility`} className="link">
            {CONTACT.hello}
          </a>{" "}
          with &ldquo;Accessibility&rdquo; in the subject. We reply within two working days and aim to fix problems, or offer another way
          to do what you need, within 30 days.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
