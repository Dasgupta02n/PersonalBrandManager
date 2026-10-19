import Link from "next/link";
import { cx } from "./ui";

const TABS = [
  { href: "/wins", label: "Wins" },
  { href: "/wins/week", label: "This week" },
  { href: "/wins/profile", label: "Profile & CV" },
  { href: "/wins/export", label: "Export" },
] as const;

export type RecordTab = (typeof TABS)[number]["href"];

/** Everything built from the record lives under the Wins tab: the wins, the week, the profile and CV, exports. */
export function RecordNav({ active }: { active: RecordTab }) {
  return (
    <nav aria-label="Your record" className="-mx-4 overflow-x-auto border-b border-border px-4 print:hidden">
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
