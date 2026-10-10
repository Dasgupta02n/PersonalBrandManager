"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { serverEnv } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  status: "idle" | "sent" | "error";
  message?: string;
}

/** Only allow redirects to paths inside this app. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/today";
}

function callbackUrl(next: string) {
  const base = serverEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) return { status: "error", message: "Enter a valid email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: callbackUrl(safeNext(formData.get("next"))) },
  });
  if (error) return { status: "error", message: "We couldn't send the link. Please try again." };
  return { status: "sent", message: `Check ${email.data} for a sign-in link.` };
}

const PROVIDERS = ["google", "azure", "linkedin_oidc"] as const;

export async function signInWithProvider(formData: FormData) {
  const provider = z.enum(PROVIDERS).parse(formData.get("provider"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callbackUrl(safeNext(formData.get("next"))) },
  });
  if (error || !data.url) redirect("/login?error=provider");
  redirect(data.url);
}
