import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/public-shell";
import { APP_NAME } from "@/lib/config/app";
import { PUBLIC_PAGES } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Site map",
  description: `Every public page on the ${APP_NAME} site.`,
  alternates: { canonical: "/site-map" },
};

export default function SiteMapPage() {
  return (
    <InfoPage path="/site-map" title="Site map" updated="2026-10-22" intro={<p>Every public page on this site, in one place.</p>}>
      {(["Product", "Trust", "Company"] as const).map((group) => (
        <InfoSection key={group} title={group}>
          <ul className="!list-none !pl-0">
            {PUBLIC_PAGES.filter((p) => p.group === group).map((p) => (
              <li key={p.path}>
                <Link href={p.path} className="link">
                  {p.path === "/" ? "Home" : p.title}
                </Link>
              </li>
            ))}
          </ul>
        </InfoSection>
      ))}
    </InfoPage>
  );
}
