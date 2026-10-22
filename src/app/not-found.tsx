import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-7 px-5 py-16">
      <Link href="/" aria-label="Home" className="w-fit">
        <Wordmark />
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-[15px] font-medium text-subtle">Error 404</p>
        <h1 className="font-display text-display-m">This page isn&apos;t here</h1>
        <p className="text-[17px] text-muted">It may have been moved or discarded.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/today" className={buttonClass("primary")}>
          Go to Today
        </Link>
        <Link href="/" className={buttonClass("secondary")}>
          Home
        </Link>
      </div>
    </main>
  );
}
