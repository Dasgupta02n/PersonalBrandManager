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
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-10">
      <Link href="/" aria-label="Home">
        <Wordmark />
      </Link>
      <div>
        <h1 className="font-display text-display-m font-medium">Finish signing in</h1>
        <p className="mt-1.5 text-[15px] text-muted">This link works once.</p>
      </div>
      <form action={confirmSignIn}>
        <input type="hidden" name="token" value={token} />
        <SubmitButton pendingLabel="Signing in…" className="w-full">
          Sign in
        </SubmitButton>
      </form>
    </main>
  );
}
