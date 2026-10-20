"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safePath } from "@/lib/auth/redirect";
import { serverEnv } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";

// Email-only sign-in: one email holds both a one-time code and a link. The code works on any
// device or browser; the link works wherever it is opened (/auth/confirm).

export interface LoginState {
  status: "idle" | "sent" | "error";
  message?: string;
  /** The address the code was sent to, once sent. */
  email?: string;
  /** When it was sent, so the form can tell a new send from an old one. */
  sentAt?: number;
}

function callbackUrl(next: string) {
  const base = serverEnv().APP_URL.replace(/\/$/, "");
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}

const Email = z.email("Enter a valid email address.");

export async function sendSignInEmail(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = Email.safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { status: "error", message: email.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    // Only the path: the email template passes this address on inside its own link.
    options: { emailRedirectTo: callbackUrl(safePath(formData.get("next")).split("?")[0]) },
  });
  if (error) {
    // Supabase allows one email a minute per address: the last code still works.
    if (error.status === 429 || /rate|seconds/i.test(error.message)) {
      return { status: "sent", email: email.data, sentAt: Date.now(), message: "We sent a code a moment ago. Use that one, or wait a minute for a new one." };
    }
    return { status: "error", message: "We couldn't send the email. Please try again." };
  }
  return { status: "sent", email: email.data, sentAt: Date.now(), message: `We sent a code and a link to ${email.data}.` };
}

const CodeSchema = z.object({
  email: Email,
  token: z
    .string()
    .transform((s) => s.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{6,10}$/, "Enter the code from the email: numbers only.")),
});

export async function verifySignInCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = CodeSchema.safeParse({ email: formData.get("email"), token: formData.get("token") });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { status: "sent", email, message: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.token, type: "email" });
  if (error) return { status: "sent", email, message: "That code didn't work. Check it, or send a new one." };
  redirect(safePath(formData.get("next")));
}
