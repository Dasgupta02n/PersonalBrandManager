import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ArrowRight, CalendarDays, ChevronRight, EyeOff, MapPin, Menu, Unplug, X } from "lucide-react";
import { APP_NAME, APP_PROMISE } from "@/lib/config/app";
import { CONTACT, OPERATOR, PUBLIC_PAGES, absoluteUrl } from "@/lib/config/site";
import { LogoMark } from "./brand";
import { cx } from "./ui";

// The public site's frame: header, footer, page heroes, reading layouts and structured data.
// Every public page renders on the server, so search engines and AI assistants read the full
// text; the look comes from src/app/(site)/site.css.

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/check", label: "Free post check" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/about", label: "About" },
];

/** The page width every public section lines up to. */
export const container = "mx-auto w-full max-w-6xl px-5 sm:px-6";

function SiteLogo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="size-8" />
      <span className="font-heading text-[19px] tracking-[-0.03em]">{APP_NAME}</span>
    </span>
  );
}

export function PublicHeader({ current }: { current?: string }) {
  return (
    <header className="site-dark site-header sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className={cx(container, "flex h-16 items-center justify-between gap-3")}>
        <Link href="/" aria-label={`${APP_NAME} home`} className="rounded-lg">
          <SiteLogo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link" aria-current={current === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <Link href="/login" className="nav-link hidden sm:inline-flex">
            Sign in
          </Link>
          <Link href="/login" className="btn btn-gold min-h-10 px-4 text-[14px]">
            <span className="sm:hidden">Join free</span>
            <span className="hidden sm:inline">Join the free beta</span>
          </Link>
          <details className="group relative lg:hidden">
            <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full text-foreground transition hover:bg-white/10">
              <Menu aria-hidden className="size-5 group-open:hidden" />
              <X aria-hidden className="hidden size-5 group-open:block" />
              <span className="sr-only">Menu</span>
            </summary>
            <nav
              aria-label="Menu"
              className="glass absolute top-[calc(100%+10px)] right-0 flex w-[min(86vw,320px)] flex-col gap-0.5 rounded-2xl p-2 shadow-2xl shadow-black/50"
            >
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="nav-link min-h-11 justify-between">
                  {item.label}
                  <ChevronRight aria-hidden className="size-4 opacity-50" />
                </Link>
              ))}
              <div className="my-1 h-px bg-white/10" />
              <Link href="/login" className="nav-link min-h-11">
                Sign in
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
    <footer className="site-dark relative isolate overflow-hidden">
      <div className="hairline" />
      <div
        aria-hidden
        className="font-heading pointer-events-none absolute inset-x-0 bottom-[-0.22em] -z-10 text-center text-[24vw] leading-none text-white/[0.035] select-none"
      >
        {APP_NAME}
      </div>
      <div className={cx(container, "grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]")}>
        <div className="flex max-w-sm flex-col gap-5">
          <SiteLogo />
          <p className="text-[15px] leading-relaxed text-muted">
            A private record of your work, and LinkedIn posts you won&apos;t regret. You approve everything; nothing is ever
            posted for you.
          </p>
          <ul className="flex flex-col gap-2.5 text-[14px] text-muted">
            <li className="flex items-center gap-2.5">
              <Unplug aria-hidden className="size-4 text-brass" /> Never touches your LinkedIn account
            </li>
            <li className="flex items-center gap-2.5">
              <EyeOff aria-hidden className="size-4 text-brass" /> No ad pixels, no trackers
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin aria-hidden className="size-4 text-brass" /> Your data on our own server in Mumbai
            </li>
          </ul>
        </div>
        {groups.map(({ group, pages }) => (
          <nav key={group} aria-label={group} className="flex flex-col gap-3 text-[15px]">
            <p className="text-[12.5px] font-semibold tracking-[0.1em] text-foreground/60 uppercase">{group}</p>
            {pages.map((p) => (
              <Link key={p.path} href={p.path} className="w-fit text-muted transition hover:text-foreground">
                {p.path === "/contact" ? "Contact and grievance officer" : p.title}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className={cx(container, "pb-12")}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-muted">
          <p>
            © 2026 {OPERATOR.legalName ?? APP_NAME}
            {OPERATOR.address ? ` · ${OPERATOR.address}` : " · India"} ·{" "}
            <a href={`mailto:${CONTACT.hello}`} className="transition hover:text-foreground">
              {CONTACT.hello}
            </a>
          </p>
          <p className="pill">
            <span className="live-dot" aria-hidden />
            {APP_NAME} is in private beta
          </p>
        </div>
      </div>
    </footer>
  );
}

/** A section heading: optional eyebrow, a title (may hold an accent word) and an intro line. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  center,
  className,
}: {
  id?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <div data-reveal className={cx("flex max-w-3xl flex-col gap-4", center && "mx-auto items-center text-center", className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id} className="font-heading text-[34px] leading-[1.06] text-balance md:text-[48px]">
        {title}
      </h2>
      {intro && <p className="text-lg leading-relaxed text-pretty text-muted md:text-xl">{intro}</p>}
    </div>
  );
}

/** A word or two set in the italic accent face with the gold gradient. */
export function Accent({ children }: { children: ReactNode }) {
  return <span className="font-accent text-gold pr-[0.06em] text-[1.08em]">{children}</span>;
}

/** The headline promise with one word in the accent face; plain text if the word ever moves. */
export function PromiseText({ word = "regret" }: { word?: string }) {
  const at = APP_PROMISE.indexOf(word);
  if (at < 0) return <>{APP_PROMISE}</>;
  return (
    <>
      {APP_PROMISE.slice(0, at)}
      <Accent>{word}</Accent>
      {APP_PROMISE.slice(at + word.length)}
    </>
  );
}

/** The night band at the top of every inner page: aurora light, grid lines, title and intro. */
export function PageHero({
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
    <section className="site-dark aurora grain under-header">
      <div className="bg-grid" />
      <div className={cx(container, "flex flex-col gap-6 pt-10 pb-16 md:pt-16 md:pb-24")}>
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
            <Link href="/" className="transition hover:text-foreground">
              Home
            </Link>
            <ChevronRight aria-hidden className="size-3.5 opacity-60" />
            <span className="text-foreground/80">{breadcrumb}</span>
          </nav>
        )}
        <h1 className="font-heading max-w-4xl text-[42px] leading-[1.03] text-balance md:text-[64px]">{title}</h1>
        {intro && (
          <div className="max-w-3xl text-lg leading-relaxed text-pretty text-muted md:text-xl [&_a]:text-accent [&_a]:underline">
            {intro}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/** A plain reading page: header, a night hero band, then one comfortable column. */
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
        <PageHero title={title} intro={intro} breadcrumb={typeof title === "string" ? title : undefined}>
          {meta}
        </PageHero>
        <div className={container}>
          <div className="flex max-w-3xl flex-col gap-14 py-14 md:py-20">{children}</div>
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
        <PageHero title={title} intro={intro} breadcrumb={title}>
          <p className="pill w-fit">
            <CalendarDays aria-hidden className="size-4 text-brass" />
            Last reviewed {formatDate(updated)}
          </p>
        </PageHero>
        <div className={cx(container, "grid gap-12 py-14 md:py-20", aside ? "lg:grid-cols-[minmax(0,1fr)_320px]" : undefined)}>
          <div className="flex max-w-3xl flex-col gap-14">{children}</div>
          {aside && <aside className="flex flex-col gap-4 self-start lg:sticky lg:top-24">{aside}</aside>}
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
    <section id={id} data-reveal className="flex scroll-mt-24 flex-col gap-4">
      <h2 className="font-heading flex items-start gap-3 text-[26px] leading-tight md:text-[30px]">
        <span
          aria-hidden
          className="mt-[0.3em] h-[0.8em] w-1 shrink-0 rounded-full bg-gradient-to-b from-[#ffd98a] to-[#e09a2f]"
        />
        {title}
      </h2>
      <div className="prose-site flex flex-col gap-4">{children}</div>
    </section>
  );
}

/** The closing call to action used at the foot of product pages. */
export function ClosingCta({ title, body }: { title: ReactNode; body?: ReactNode }) {
  return (
    <section className="site-dark aurora grain">
      <div className="bg-grid" />
      <div className={cx(container, "flex flex-col items-center gap-6 py-24 text-center md:py-32")}>
        <h2 data-reveal className="font-heading max-w-3xl text-[38px] leading-[1.05] text-balance md:text-[60px]">
          {title}
        </h2>
        {body && <p className="max-w-xl text-lg text-muted">{body}</p>}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className="btn btn-gold btn-lg">
            Join the free beta
            <ArrowRight aria-hidden />
          </Link>
          <Link href="/check" className="btn btn-glass btn-lg">
            Check a post free
          </Link>
        </div>
        <p className="text-sm text-muted">Free during the beta · No card · Nothing is ever posted for you</p>
      </div>
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
    <div className="card spotlight flex flex-col gap-5 p-6">
      <p className="eyebrow">{title}</p>
      <ul className="flex flex-col gap-4">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-[15px] leading-snug">
            <span className="icon-chip size-9 rounded-xl [&_svg]:!size-[18px]">
              <item.icon aria-hidden />
            </span>
            <span className="pt-0.5">{item.text}</span>
          </li>
        ))}
      </ul>
      {action}
    </div>
  );
}
