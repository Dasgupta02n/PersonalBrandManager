import Link from "next/link";
import { APP_NAME } from "@/lib/config/app";

const nav = [
  { href: "/today", label: "Today" },
  { href: "/drafts", label: "Drafts" },
  { href: "/engage", label: "Engage" },
  { href: "/wins", label: "Wins" },
  { href: "/onboarding", label: "Settings" },
];

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/today" className="font-bold">
            {APP_NAME}
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-sm text-muted hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>
        <nav aria-label="Main" className="mx-auto flex w-full max-w-3xl gap-1 overflow-x-auto px-2 pb-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-accent-soft hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">{children}</main>
    </div>
  );
}
