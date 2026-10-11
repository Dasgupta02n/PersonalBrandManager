import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-16">
      <Wordmark />
      <div>
        <h1 className="font-display text-display-m font-medium">This page isn&apos;t here</h1>
        <p className="mt-2 text-[15px] text-muted">It may have been moved or discarded.</p>
      </div>
      <Link href="/today" className={buttonClass("primary", "self-start")}>
        Go to Today
      </Link>
    </main>
  );
}
