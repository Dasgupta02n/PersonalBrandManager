import Link from "next/link";
import { cx } from "./ui";

const TABS = [
  { href: "/network", label: "Overview" },
  { href: "/network/contacts", label: "People" },
  { href: "/network/firms", label: "Search firms" },
  { href: "/network/roles", label: "Roles" },
] as const;

export type NetworkTab = (typeof TABS)[number]["href"];

/** The Network tab's sections: what's due, the people, the firm directory, the roles in play. */
export function NetworkNav({ active }: { active: NetworkTab }) {
  return (
    <nav aria-label="Network" className="-mx-4 overflow-x-auto border-b border-border px-4 print:hidden">
      <ul className="flex gap-1">
        {TABS.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab.href === active ? "page" : undefined}
              className={cx(
                "-mb-px flex min-h-11 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap transition",
                tab.href === active ? "border-ink text-foreground" : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
