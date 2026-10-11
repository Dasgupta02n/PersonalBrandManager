"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, MessageSquareText, Sun, Trophy, type LucideIcon } from "lucide-react";
import { cx } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/drafts", label: "Drafts", icon: FileText },
  { href: "/engage", label: "Comment", icon: MessageSquareText },
  { href: "/wins", label: "Wins", icon: Trophy },
];

/** Screens pushed on top of a tab (a draft, setup) hide the tab bar to make room for their own action bar. */
function isPushedScreen(pathname: string) {
  return /^\/drafts\/[^/]+/.test(pathname) || pathname.startsWith("/onboarding");
}

function useActive() {
  const pathname = usePathname();
  return { pathname, isActive: (href: string) => pathname === href || pathname.startsWith(`${href}/`) };
}

function Count({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span className="rounded-full bg-ink px-1.5 text-[11px] leading-[18px] font-semibold text-ink-foreground tabular-nums">
      {value > 9 ? "9+" : value}
      <span className="sr-only"> waiting</span>
    </span>
  );
}

/** Inline navigation for the header on larger screens. */
export function DesktopNav({ draftCount }: { draftCount: number }) {
  const { isActive } = useActive();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {NAV.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cx(
            "flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition",
            isActive(href) ? "bg-surface text-foreground" : "text-muted hover:text-foreground",
          )}
        >
          {label}
          {href === "/drafts" && <Count value={draftCount} />}
        </Link>
      ))}
    </nav>
  );
}

/** Thumb-reach tab bar on phones: four visible destinations beat a hidden menu. */
export function MobileTabBar({ draftCount }: { draftCount: number }) {
  const { pathname, isActive } = useActive();
  if (isPushedScreen(pathname)) return null;
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid h-14 max-w-md grid-cols-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-[13px] font-medium transition",
                  active ? "text-foreground" : "text-muted",
                )}
              >
                <span className="relative">
                  <Icon aria-hidden className="size-[22px]" strokeWidth={active ? 2.25 : 1.75} />
                  {href === "/drafts" && draftCount > 0 && (
                    <span className="absolute -top-1.5 -right-3">
                      <Count value={draftCount} />
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
