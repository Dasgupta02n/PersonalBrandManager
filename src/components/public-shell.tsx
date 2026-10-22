import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ChevronRight, Menu } from "lucide-react";
import { APP_NAME } from "@/lib/config/app";
import { CONTACT, OPERATOR, PUBLIC_PAGES, absoluteUrl } from "@/lib/config/site";
import { Wordmark } from "./brand";
import { cx } from "./ui";

// The public site's frame: header, footer, page titles, reading layouts and structured data.
// Every public page renders on the server, so search engines and AI assistants read the full
// text; the look comes from src/app/(site)/site.css on the shared tokens.

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/check", label: "Free post check" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/about", label: "About" },
];

/** The page width every public section lines up to: 1,200px of content inside 32px padding. */
export const container = "mx-auto w-full max-w-[1264px] px-5 md:px-8";

export function PublicHeader({ current }: { current?: string }) {
  return (
    <header className="site-header z-40 md:sticky md:top-0">
      <div className={cx(container, "flex h-[60px] items-center justify-between gap-4 md:h-[72px]")}>
        <Link href="/" aria-label={`${APP_NAME} home`} className="-m-1 rounded-md p-1">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="hidden items-center lg:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link" aria-current={current === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="nav-link text-foreground">
            Sign in
          </Link>
          <Link href="/login" className="btn btn-primary btn-sm hidden md:inline-flex">
            Join the free beta
          </Link>
          <details className="group lg:hidden">
            <summary className="btn btn-secondary btn-sm list-none gap-1.5 px-3">
              <Menu aria-hidden className="!size-4" />
              Menu
            </summary>
            <nav
              aria-label="Menu"
              className="fixed inset-x-0 top-[60px] bottom-0 z-50 flex flex-col overflow-y-auto border-t border-border bg-background px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:top-[72px] md:px-8"
            >
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-14 items-center justify-between border-b border-border text-[20px] font-medium"
                >
                  {item.label}
                  <ChevronRight aria-hidden className="size-5 text-subtle" />
                </Link>
              ))}
              <Link href="/login" className="flex min-h-14 items-center border-b border-border text-[20px] font-medium">
                Sign in
              </Link>
              <Link href="/login" className="btn btn-primary mt-auto min-h-[52px] w-full">
                Join the free beta
              </Link>
            </nav>
          </details>
        </div>
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
    <footer className="border-t border-border bg-band">
      <div className={cx(container, "grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]")}>
        <div className="flex max-w-xs flex-col gap-4">
          <Wordmark />
          <p className="text-[16px] leading-relaxed text-muted">
            A private record of your work, and LinkedIn posts you won&apos;t regret. Nothing is ever posted for you.
          </p>
        </div>
        {groups.map(({ group, pages }) => (
          <nav key={group} aria-label={group} className="flex flex-col gap-3 text-[16px]">
            <p className="font-semibold">{group}</p>
            {pages.map((p) => (
              <Link key={p.path} href={p.path} className="w-fit text-muted transition-colors duration-150 hover:text-foreground">
                {p.path === "/contact" ? "Contact and grievance officer" : p.title}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className={container}>
        <p className="border-t border-border py-6 text-[15px] leading-relaxed text-muted">
          © 2026 {OPERATOR.legalName ?? APP_NAME}
          {OPERATOR.address ? ` · ${OPERATOR.address}` : " · India"} ·{" "}
          <a href={`mailto:${CONTACT.hello}`} className="transition-colors duration-150 hover:text-foreground">
            {CONTACT.hello}
          </a>{" "}
          · {APP_NAME} is in private beta.
        </p>
      </div>
    </footer>
  );
}

/** A section heading: a title and, if needed, one line of introduction. */
export function SectionHeading({
  id,
  title,
  intro,
  className,
}: {
  id?: string;
  title: ReactNode;
  intro?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex max-w-[44rem] flex-col gap-4", className)}>
      <h2 id={id} className="t-h2">
        {title}
      </h2>
      {intro && <p className="t-lead measure">{intro}</p>}
    </div>
  );
}

/** The title block at the top of every inner page. */
export function PageTitle({
  title,
  intro,
  breadcrumb,
  children,
}: {
  title: ReactNode;
  intro?: ReactNode;
  breadcrumb?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-border">
      <div className={cx(container, "flex flex-col gap-5 pt-10 pb-12 md:pt-16 md:pb-16")}>
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="t-caption flex items-center gap-1.5">
            <Link href="/" className="transition-colors duration-150 hover:text-foreground">
              Home
            </Link>
            <ChevronRight aria-hidden className="size-3.5" />
            <span className="text-muted">{breadcrumb}</span>
          </nav>
        )}
        <h1 className="t-h1 max-w-[48rem]">{title}</h1>
        {intro && (
          <div className="t-lead max-w-[40rem] [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-[0.18em]">{intro}</div>
        )}
        {children}
      </div>
    </section>
  );
}

/** A plain reading page: header, title block, then one comfortable column. */
export function PublicPage({
  path,
  title,
  intro,
  meta,
  children,
}: {
  path?: string;
  title: ReactNode;
  intro?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader current={path} />
      <main className="flex flex-1 flex-col">
        <PageTitle title={title} intro={intro} breadcrumb={typeof title === "string" ? title : undefined}>
          {meta}
        </PageTitle>
        <div className={container}>
          <div className="flex max-w-[45rem] flex-col gap-16 py-14 md:py-20">{children}</div>
        </div>
      </main>
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

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
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
      <PublicHeader current={path} />
      <main className="flex flex-1 flex-col">
        <PageTitle title={title} intro={intro} breadcrumb={title}>
          <p className="t-caption">Last reviewed {formatDate(updated)}</p>
        </PageTitle>
        <div className={cx(container, "grid gap-12 py-14 md:py-20", aside ? "lg:grid-cols-[minmax(0,45rem)_1fr]" : undefined)}>
          <div className="flex max-w-[45rem] min-w-0 flex-col gap-16">{children}</div>
          {aside && <aside className="flex flex-col gap-4 self-start lg:sticky lg:top-28 lg:ml-auto lg:w-[320px]">{aside}</aside>}
        </div>
      </main>
      <PublicFooter />
      <JsonLd data={breadcrumb} />
    </div>
  );
}

/** A titled section on an information page. */
export function InfoSection({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-28 flex-col gap-5">
      <h2 className="t-h3">{title}</h2>
      <div className="prose-site">{children}</div>
    </section>
  );
}

/** A side panel for information pages: a few facts at a glance, and an optional action. */
export function AsideCard({
  title,
  items,
  action,
}: {
  title: string;
  items: { icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; text: ReactNode }[];
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border p-6">
      <p className="t-title">{title}</p>
      <ul className="flex flex-col gap-4">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-[16px] leading-snug text-muted">
            <item.icon aria-hidden className="mt-0.5 size-[18px] shrink-0 text-foreground" />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
      {action}
    </div>
  );
}

/** The closing call to action at the foot of product pages. */
export function ClosingCta({ title, body }: { title: ReactNode; body?: ReactNode }) {
  return (
    <section className="border-t border-border bg-band">
      <div className={cx(container, "flex flex-col gap-6 py-20 md:py-28")}>
        <h2 className="t-h2 max-w-[40rem]">{title}</h2>
        {body && <p className="t-lead measure">{body}</p>}
        <div data-cta className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/login" className="btn btn-primary btn-block-phone">
            Join the free beta
          </Link>
          <Link href="/check" className="text-link text-[17px] font-medium">
            Check a post free
          </Link>
        </div>
        <p className="t-caption">Free during the beta. No card. Nothing is ever posted for you.</p>
      </div>
    </section>
  );
}
