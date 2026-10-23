import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ClosingCta, JsonLd, PageTitle, PublicFooter, PublicHeader, container, formatDate } from "@/components/public-shell";
import { cx } from "@/components/ui";
import { APP_NAME } from "@/lib/config/app";
import { CONTACT, absoluteUrl } from "@/lib/config/site";
import { FIRMS, type Firm } from "@/lib/network/firms";
import { FIRM_KIND_LABEL, MARKET_LABEL, MARKETS, SECTOR_LABEL, type Market, type Seniority } from "@/lib/network/taxonomy";

const COUNT = FIRMS.length;
const CHECKED = FIRMS.reduce((latest, f) => (f.checked > latest ? f.checked : latest), "2026-10-23");

export const metadata: Metadata = {
  title: "Executive search firms in India, the UAE, the UK, Singapore and the US",
  description: `${COUNT} executive search and senior recruitment firms with offices in India, the UAE, the UK, Singapore and the US, with the sectors and levels each covers, checked on each firm's own website.`,
  alternates: { canonical: "/search-firms" },
};

const LEVEL: Record<Seniority, string> = { board: "Board", cxo: "CXO", vp_director: "Director and VP", manager: "Manager" };
const IN_PLACE: Record<Market, string> = { IN: "India", AE: "the UAE", GB: "the UK", SG: "Singapore", US: "the US" };

function sectorsLine(firm: Firm): string {
  if (!firm.sectors.length) return "Sectors not listed on its site";
  const names = firm.sectors.map((s) => SECTOR_LABEL[s]);
  return names.length > 4 ? `${names.slice(0, 4).join(", ")} and ${names.length - 4} more` : names.join(", ");
}

export default function SearchFirmsPage() {
  const byMarket = MARKETS.map((market) => ({
    market,
    firms: FIRMS.filter((f) => f.markets.includes(market)).sort((a, b) => a.name.localeCompare(b.name)),
  }));

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Executive search firms in India, the UAE, the UK, Singapore and the US",
    numberOfItems: COUNT,
    itemListElement: [...FIRMS]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((firm, i) => ({ "@type": "ListItem", position: i + 1, name: firm.name, url: firm.website })),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Search firms", item: absoluteUrl("/search-firms") },
    ],
  };

  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader current="/search-firms" />
      <main className="flex flex-1 flex-col">
        <PageTitle
          breadcrumb="Search firms"
          title="Executive search firms in India, the UAE, the UK, Singapore and the US"
          intro={
            <p>
              {COUNT} executive search and senior recruitment firms, with the countries, sectors and levels each one says it covers on
              its own website. Firm details only: no people, no contact details, and no firm pays to be listed.
            </p>
          }
        >
          <p className="t-caption">Last checked {formatDate(CHECKED)}</p>
          <nav aria-label="Countries" className="flex flex-wrap gap-2 pt-2">
            {byMarket.map(({ market, firms }) => (
              <a key={market} href={`#${market.toLowerCase()}`} className="btn btn-secondary btn-sm">
                {MARKET_LABEL[market]} <span className="tnum text-subtle">{firms.length}</span>
              </a>
            ))}
          </nav>
        </PageTitle>

        <div className={cx(container, "grid gap-16 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12")}>
          <div className="flex min-w-0 flex-col gap-16">
            {byMarket.map(({ market, firms }) => (
              <section key={market} id={market.toLowerCase()} aria-labelledby={`h-${market}`} className="flex scroll-mt-28 flex-col gap-5">
                <h2 id={`h-${market}`} className="t-h3">
                  Search firms in {IN_PLACE[market]} <span className="text-subtle">· {firms.length}</span>
                </h2>
                <ul className="grid border-t border-border md:grid-cols-2 md:gap-x-10">
                  {firms.map((firm) => (
                    <li key={firm.id} className="flex flex-col gap-1 border-b border-border py-4">
                      <a
                        href={firm.website}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="inline-flex w-fit items-center gap-1 text-[17px] font-semibold hover:underline"
                      >
                        {firm.name}
                        <ArrowUpRight aria-hidden className="size-4 text-subtle" />
                      </a>
                      <p className="text-[15px] text-muted">
                        {FIRM_KIND_LABEL[firm.kind]}
                        {firm.seniority.length > 0 && ` · ${firm.seniority.map((s) => LEVEL[s]).join(", ")}`}
                      </p>
                      <p className="text-[15px] leading-snug text-muted">{sectorsLine(firm)}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <section aria-labelledby="how-compiled" className="flex flex-col gap-4">
              <h2 id="how-compiled" className="t-h3">
                How this list is made
              </h2>
              <div className="prose-site">
                <ul>
                  <li>Every firm, office and practice is taken from the firm&apos;s own website, and the page is kept with the date we checked it.</li>
                  <li>We list firms, never their consultants, and never publish anyone&apos;s contact details.</li>
                  <li>No firm pays to be listed or ranked. Inclusion is not an endorsement.</li>
                  <li>
                    Something out of date, or a firm we should add? Write to{" "}
                    <a href={`mailto:${CONTACT.hello}`}>{CONTACT.hello}</a>.
                  </li>
                </ul>
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-5 self-start rounded-xl border border-border p-6 lg:sticky lg:top-28">
            <p className="t-title">The firms that fit you, and the people</p>
            <p className="text-[16px] leading-relaxed text-muted">
              In {APP_NAME}, a few questions about the role you&apos;d want next rank these firms for you, and suggest the roles worth
              knowing at your competitors. Keep every conversation and follow-up in one private place, with messages written from
              your record that you send yourself.
            </p>
            <Link href="/login" className="btn btn-primary">
              Join the free beta
            </Link>
            <Link href="/how-it-works" className="text-link text-[16px]">
              How it works
            </Link>
          </aside>
        </div>
        <ClosingCta title="The next role comes through people. Know the right ones." />
      </main>
      <PublicFooter />
      <JsonLd data={[itemList, breadcrumb]} />
    </div>
  );
}
