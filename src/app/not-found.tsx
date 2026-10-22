import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { siteFonts } from "./fonts";
import "./(site)/site.css";

export default function NotFound() {
  return (
    <div className={`${siteFonts} flex min-h-full flex-1 flex-col`}>
      <main className="site-dark aurora grain flex flex-1 flex-col justify-center px-5 py-16">
        <div className="bg-grid" />
        <div className="mx-auto flex w-full max-w-md flex-col gap-7">
          <Link href="/" aria-label="Home" className="w-fit">
            <Wordmark />
          </Link>
          <p className="font-heading text-gold text-[96px] leading-none tracking-[-0.05em]">404</p>
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-[32px] leading-tight">This page isn&apos;t here</h1>
            <p className="text-[16px] text-muted">It may have been moved or discarded.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/today" className="btn btn-gold">
              Go to Today
              <ArrowRight aria-hidden />
            </Link>
            <Link href="/" className="btn btn-glass">
              Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
