import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/client";
import { Card, Notice } from "@/components/ui";
import { APP_NAME } from "@/lib/config/app";
import { signInWithProvider } from "./actions";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const providers = [
  { id: "google", label: "Continue with Google" },
  { id: "azure", label: "Continue with Microsoft" },
  { id: "linkedin_oidc", label: "Continue with LinkedIn" },
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/today";
  const failed = params.error === "provider" || params.error === "callback";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <Link href="/" className="text-lg font-bold">
        {APP_NAME}
      </Link>
      <Card className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-muted">New here? Signing in creates your account.</p>
        </div>
        {failed && <Notice tone="danger">That sign-in didn&apos;t work. Please try again.</Notice>}
        <LoginForm next={next} />
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="flex flex-col gap-2">
          {providers.map((p) => (
            <form key={p.id} action={signInWithProvider}>
              <input type="hidden" name="provider" value={p.id} />
              <input type="hidden" name="next" value={next} />
              <SubmitButton variant="secondary" className="w-full" pendingLabel="Redirecting…">
                {p.label}
              </SubmitButton>
            </form>
          ))}
        </div>
        <p className="text-xs text-muted">
          Signing in with LinkedIn only shares your name, email and photo. We never post or act on LinkedIn for you.
        </p>
      </Card>
    </main>
  );
}
