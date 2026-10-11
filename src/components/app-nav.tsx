"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, MessagesSquare, Sun, Trophy, type LucideIcon } from "lucide-react";
import { cx } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/drafts", label: "Drafts", icon: FileText },
  { href: "/engage", label: "Engage", icon: MessagesSquare },
  { href: "/wins", label: "Wins", icon: Trophy },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

function Count({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span className="rounded-full bg-brass px-1.5 text-[11px] leading-[18px] font-bold text-white tabular-nums">
      {value > 9 ? "9+" : value}
      <span className="sr-only"> drafts to act on</span>
    </span>
  );
}

/** Inline navigation for the header on larger screens. */
export function DesktopNav({ draftCount }: { draftCount: number }) {
  const isActive = useActive();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {NAV.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cx(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition",
            isActive(href) ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground",
          )}
        >
          {label}
          {href === "/drafts" && <Count value={draftCount} />}
        </Link>
      ))}
    </nav>
  );
}

/** Thumb-reach tab bar on phones. */
export function MobileTabBar({ draftCount }: { draftCount: number }) {
  const isActive = useActive();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-semibold transition",
                  active ? "text-foreground" : "text-subtle",
                )}
              >
                {active && <span aria-hidden className="absolute top-0 h-0.5 w-8 rounded-full bg-ink" />}
                <span className="relative">
                  <Icon aria-hidden className="size-[22px]" strokeWidth={active ? 2.25 : 1.75} />
                  {href === "/drafts" && draftCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5">
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
