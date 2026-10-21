import Link from "next/link";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/config/app";
import { CONTACT, OPERATOR, PUBLIC_PAGES, absoluteUrl } from "@/lib/config/site";
import { Wordmark } from "./brand";
import { buttonClass } from "./ui";

// The public site's frame: header, footer, reading layouts and structured data. Every public
// page renders on the server, so search engines and AI assistants read the full text.

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/check", label: "Free post check" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/about", label: "About" },
];

export function PublicHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
        <Link href="/" aria-label={`${APP_NAME} home`}>
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-x-1">
          <div className="hidden items-center lg:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={buttonClass("ghost", undefined, "sm")}>
                {item.label}
              </Link>
            ))}
          </div>
          <Link href="/login" className={buttonClass("ghost", undefined, "sm")}>
            Sign in
          </Link>
          <Link href="/login" className={buttonClass("primary", undefined, "sm")}>
            Join the free beta
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  const groups = (["Product", "Trust", "Company"] as const).map((group) => ({
    group,
    pages: PUBLIC_PAGES.filter((p) => p.group === group && p.path !== "/"),
  }));
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12">
        <div className="flex flex-wrap gap-x-16 gap-y-8">
          <div className="flex max-w-xs flex-[1_1_240px] flex-col gap-3">
            <Wordmark />
            <p className="text-[15px] leading-relaxed text-muted">A private record of your work, and LinkedIn posts you won&apos;t regret.</p>
          </div>
          {groups.map(({ group, pages }) => (
            <nav key={group} aria-label={group} className="flex min-w-36 flex-col gap-2 text-[15px]">
              <p className="text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">{group}</p>
              {pages.map((p) => (
                <Link key={p.path} href={p.path} className="hover:underline">
                  {p.path === "/contact" ? "Contact and grievance officer" : p.title}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <p className="border-t border-border pt-5 text-sm leading-relaxed text-muted">
          © 2026 {OPERATOR.legalName ?? APP_NAME}
          {OPERATOR.address ? ` · ${OPERATOR.address}` : " · India"} ·{" "}
          <a href={`mailto:${CONTACT.hello}`} className="hover:underline">
            {CONTACT.hello}
          </a>{" "}
          · {APP_NAME} is in private beta.
        </p>
      </div>
    </footer>
  );
}

/** A plain reading column for public text pages. */
export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-8 px-4 pt-6 pb-16">{children}</main>
      <PublicFooter />
    </div>
  );
}

/** Structured data for search engines, escaped so text can never close the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}

export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/**
 * A trust or information page: breadcrumb, an answer-first introduction, a last-reviewed date and
 * the page's sections, with BreadcrumbList structured data.
 */
export function InfoPage({
  path,
  title,
  intro,
  updated,
  children,
  aside,
}: {
  path: string;
  title: string;
  intro: ReactNode;
  updated: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: title, item: absoluteUrl(path) },
    ],
  };
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 pt-8 pb-20">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/" className="link">
            Home
          </Link>{" "}
          / {title}
        </nav>
        <div className="flex flex-wrap items-start gap-10">
          <header className="flex max-w-3xl flex-[999_1_560px] flex-col gap-4">
            <h1 className="font-display text-[40px] leading-[1.08] font-medium text-balance md:text-[52px]">{title}</h1>
            <div className="text-lg leading-relaxed text-foreground/85 md:text-xl">{intro}</div>
            <p className="text-sm text-muted">Last reviewed {formatDate(updated)}</p>
          </header>
          {aside}
        </div>
        <div className="flex max-w-3xl flex-col gap-10">{children}</div>
      </main>
      <PublicFooter />
      <JsonLd data={breadcrumb} />
    </div>
  );
}

/** A titled section on an information page. */
export function InfoSection({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-3">
      <h2 className="font-display text-[28px] leading-tight font-medium">{title}</h2>
      <div className="flex flex-col gap-3 text-[17px] leading-relaxed text-foreground/85 [&_li]:pl-1 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}
