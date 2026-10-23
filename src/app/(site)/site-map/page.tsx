import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
    <InfoPage path="/site-map" title="Site map" updated="2026-10-23" intro={<p>Every public page on this site, in one place.</p>}>
      {(["Product", "Trust", "Company"] as const).map((group) => (
        <InfoSection key={group} title={group}>
          <ul className="!list-none !pl-0 grid border-t border-border sm:grid-cols-2 sm:gap-x-10">
            {PUBLIC_PAGES.filter((p) => p.group === group).map((p) => (
              <li key={p.path} className="!mt-0 border-b border-border">
                <Link
                  href={p.path}
                  className="flex min-h-14 items-center justify-between gap-3 py-3 text-[17px] font-medium text-foreground transition-colors duration-150 hover:text-accent"
                >
                  {p.path === "/" ? "Home" : p.title}
                  <ArrowUpRight aria-hidden className="size-4 shrink-0 text-subtle" />
                </Link>
              </li>
            ))}
          </ul>
        </InfoSection>
      ))}
    </InfoPage>
  );
}
