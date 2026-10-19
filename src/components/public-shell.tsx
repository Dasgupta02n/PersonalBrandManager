import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "./brand";
import { buttonClass } from "./ui";

/** Header for public pages: home, the free check, pricing and sign-in. */
export function PublicHeader() {
  return (
    <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-2 px-4">
      <Link href="/" aria-label="Home">
        <Wordmark />
      </Link>
      <nav aria-label="Main" className="flex items-center">
        <div className="hidden items-center sm:flex">
          <Link href="/check" className={buttonClass("ghost", undefined, "sm")}>
            Free post check
          </Link>
          <Link href="/#pricing" className={buttonClass("ghost", undefined, "sm")}>
            Pricing
          </Link>
        </div>
        <Link href="/login" className={buttonClass("ghost", undefined, "sm")}>
          Sign in
        </Link>
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <Wordmark />
      <p>Your record is yours. We never sell or share it.</p>
      <nav aria-label="Footer" className="flex gap-4">
        <Link href="/check" className="hover:text-foreground">
          Free post check
        </Link>
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
      </nav>
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
