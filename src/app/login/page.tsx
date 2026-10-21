import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { Notice } from "@/components/ui";
import { APP_PROMISE } from "@/lib/config/app";
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
    <div className="grid flex-1 md:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-ink p-10 text-ink-foreground md:flex">
        <Link href="/" aria-label="Home" className="[&_rect]:fill-ink-foreground [&_circle:first-of-type]:stroke-ink">
          <Wordmark />
        </Link>
        <div>
          <p className="font-display text-display-l font-medium text-balance">{APP_PROMISE}</p>
          <ul className="mt-8 flex flex-col gap-3">
            {reassurances.map((r) => (
              <li key={r} className="flex items-center gap-2.5 opacity-90">
                <CircleCheck aria-hidden className="size-[18px]" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm opacity-70">Private beta</p>
      </aside>

      <main className="mx-auto flex w-full max-w-sm flex-col justify-center gap-8 px-4 py-10">
        <Link href="/" aria-label="Home" className="md:hidden">
          <Wordmark />
        </Link>
        <div>
          <h1 className="font-display text-display-m font-medium">Sign in</h1>
          <p className="mt-1.5 text-[15px] text-muted">No password. New here? Signing in creates your account.</p>
        </div>
        {failed && (
          <Notice tone="danger">That link has expired or was already used. Ask for a new code below.</Notice>
        )}
        <LoginForm next={next} />
        <p className="text-[13px] leading-relaxed text-muted">
          We only ask for your email. We never post or act on LinkedIn for you. See the{" "}
          <Link href="/privacy" className="link">
            privacy notice
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
