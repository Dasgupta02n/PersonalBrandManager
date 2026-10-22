import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { SubmitButton } from "@/components/client";
import { confirmSignIn } from "./actions";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

/**
 * Opened from the link in the sign-in email, on any device. Signing in takes a press of the
 * button: email security scanners open links on their own, and must not use the link up.
 */
export default async function ConfirmPage({ searchParams }: PageProps<"/auth/confirm">) {
  const { token } = await searchParams;
  if (typeof token !== "string" || !token) redirect("/login?error=link");

  return (
    <main className="site-dark aurora grain flex flex-1 flex-col justify-center px-5 py-12">
      <div className="bg-grid" />
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        <Link href="/" aria-label="Home" className="w-fit">
          <Wordmark />
        </Link>
        <div className="card flex flex-col gap-6 p-7">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-[30px] leading-tight">Finish signing in</h1>
            <p className="text-[15px] text-muted">This link works once.</p>
          </div>
          <form action={confirmSignIn}>
            <input type="hidden" name="token" value={token} />
            <SubmitButton variant="gold" pendingLabel="Signing in…" className="w-full">
              Sign in
            </SubmitButton>
          </form>
        </div>
      </div>
    </main>
  );
}
