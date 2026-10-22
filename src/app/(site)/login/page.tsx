import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { LogoMark, Wordmark } from "@/components/brand";
import { PromiseText } from "@/components/public-shell";
import { Notice } from "@/components/ui";
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
    <div className="grid flex-1 lg:grid-cols-[1.1fr_1fr]">
      <aside className="site-dark aurora grain hidden flex-col justify-between p-12 lg:flex">
        <div className="bg-grid" />
        <Link href="/" aria-label="Home" className="flex w-fit items-center gap-2.5">
          <LogoMark className="size-8" />
          <span className="font-heading text-[19px] tracking-[-0.03em]">Winwall</span>
        </Link>
        <div className="flex flex-col gap-8">
          <p className="font-heading max-w-lg text-[56px] leading-[1.02] text-balance">
            <PromiseText />
          </p>
          <ul className="flex flex-col gap-3.5">
            {reassurances.map((r) => (
              <li key={r} className="flex items-center gap-3 text-[16px] text-foreground/85">
                <span className="flex size-6 items-center justify-center rounded-full bg-success-soft">
                  <CircleCheck aria-hidden className="size-4 text-success" />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </div>
        <p className="pill w-fit">
          <span className="live-dot" aria-hidden />
          Private beta
        </p>
      </aside>

      <main className="relative flex flex-col justify-center px-5 py-12">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <Link href="/" aria-label="Home" className="lg:hidden">
            <Wordmark />
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-[36px] leading-tight">Sign in</h1>
            <p className="text-[15px] text-muted">No password. New here? Signing in creates your account.</p>
          </div>
          {failed && <Notice tone="danger">That link has expired or was already used. Ask for a new code below.</Notice>}
          <div className="card p-6">
            <LoginForm next={next} />
          </div>
          <p className="text-[13px] leading-relaxed text-muted">
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
