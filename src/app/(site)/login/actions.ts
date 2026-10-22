"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safePath } from "@/lib/auth/redirect";
import { startSession } from "@/lib/auth/session";
import { requestSignIn, verifyCode } from "@/lib/auth/sign-in";

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

const Email = z.email("Enter a valid email address.");

/** The visitor's address as the reverse proxy saw it, for per-address limits (stored hashed). */
async function clientIp(): Promise<string | null> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || null;
}

export async function sendSignInEmail(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = Email.safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { status: "error", message: email.error.issues[0]?.message };

  const result = await requestSignIn({ email: email.data, next: safePath(formData.get("next")), ip: await clientIp() });
  if (!result.ok) {
    switch (result.reason) {
      case "too_soon":
        // One email a minute per address: the last code still works.
        return { status: "sent", email: email.data, sentAt: Date.now(), message: "We sent a code a moment ago. Use that one, or wait a minute for a new one." };
      case "too_many":
        return { status: "error", email: email.data, message: "Too many sign-in emails for now. Use the last one we sent, or try again in an hour." };
      case "send_failed":
        return { status: "error", email: email.data, message: "We couldn't send the email. Please try again." };
    }
  }
  return { status: "sent", email: email.data, sentAt: Date.now(), message: `We sent a code and a link to ${email.data}.` };
}

const CodeSchema = z.object({
  email: Email,
  token: z
    .string()
    .transform((s) => s.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{6}$/, "Enter the 6-digit code from the email.")),
});

export async function verifySignInCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = CodeSchema.safeParse({ email: String(formData.get("email") ?? "").trim().toLowerCase(), token: formData.get("token") });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { status: "sent", email, message: parsed.error.issues[0]?.message };

  const result = await verifyCode(parsed.data.email, parsed.data.token, safePath(formData.get("next")));
  if (!result.ok) {
    const message = {
      wrong: "That code didn't work. Check it, or send a new one.",
      locked: "Too many wrong codes. Send a new one, or use the link in the email.",
      expired: "That code has expired or was already used. Send a new one.",
    }[result.reason];
    return { status: "sent", email, message };
  }
  await startSession(result.userId);
  redirect(result.next);
}
