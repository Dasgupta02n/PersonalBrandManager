import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { container } from "@/components/public-shell";
import { Notice, cx } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const reassurances = [
  "Nothing is posted without you",
  "We never log in to or read your LinkedIn",
  "Your notes stay private, and they're yours",
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/today";
  const failed = params.error === "link";

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className={cx(container, "flex h-[60px] items-center justify-between md:h-[72px]")}>
          <Link href="/" aria-label="Winwall home" className="-m-1 rounded-md p-1">
            <Wordmark />
          </Link>
          <Link href="/" className="nav-link">
            Back to home
          </Link>
        </div>
      </header>
      <main className={cx(container, "grid flex-1 content-start gap-12 py-12 md:py-20 lg:grid-cols-12 lg:gap-8")}>
        <div className="flex flex-col gap-5 lg:col-span-5">
          <h1 className="t-h1">Sign in</h1>
          <p className="t-lead">No password. New here? Signing in creates your account.</p>
          <ul className="flex flex-col gap-3 pt-2">
            {reassurances.map((r) => (
              <li key={r} className="flex items-center gap-3 text-[17px]">
                <Check aria-hidden className="size-4 shrink-0" strokeWidth={2.25} />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-5 lg:col-span-5 lg:col-start-8">
          {failed && <Notice tone="danger">That link has expired or was already used. Ask for a new code below.</Notice>}
          <div className="rounded-xl border border-border p-6 md:p-8">
            <LoginForm next={next} />
          </div>
          <p className="t-caption">
            We only ask for your email. We never post or act on LinkedIn for you. See the{" "}
            <Link href="/privacy" className="link">
              privacy notice
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
