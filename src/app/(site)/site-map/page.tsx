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
    <InfoPage path="/site-map" title="Site map" updated="2026-10-22" intro={<p>Every public page on this site, in one place.</p>}>
      {(["Product", "Trust", "Company"] as const).map((group) => (
        <InfoSection key={group} title={group}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {PUBLIC_PAGES.filter((p) => p.group === group).map((p) => (
              <li key={p.path} className="!pl-0 before:!hidden">
                <Link
                  href={p.path}
                  className="card card-hover flex min-h-14 items-center justify-between gap-3 px-5 py-3 text-[16px] font-medium text-foreground"
                >
                  {p.path === "/" ? "Home" : p.title}
                  <ArrowUpRight aria-hidden className="size-4 shrink-0 text-brass" />
                </Link>
              </li>
            ))}
          </ul>
        </InfoSection>
      ))}
    </InfoPage>
  );
}
