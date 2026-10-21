import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { APP_NAME } from "@/lib/config/app";
import { serverEnv } from "@/lib/config/env";

// Sign-in emails go out through our own mailbox (hello@c7xai.in on Hostinger) over SMTP.

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The sign-in email: one code and one link; either works once. */
export function signInEmail({ code, link, minutes }: { code: string; link: string; minutes: number }) {
  const subject = "Your sign-in code";
  const text = [
    `Your sign-in code is ${code}`,
    "",
    `Type it on the sign-in page, or open this link on any device: ${link}`,
    `Either works once and expires in ${minutes} minutes.`,
    "",
    "If you didn't ask to sign in, ignore this email. Nobody can sign in without it.",
  ].join("\n");
  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; color: #1c1b19; font-size: 15px; line-height: 1.5;">
  <p>Your sign-in code is:</p>
  <p style="font-size: 28px; font-weight: 600; letter-spacing: 6px; margin: 16px 0;">${escape(code)}</p>
  <p>Type it on the sign-in page, or <a href="${escape(link)}">sign in with this link</a> on any device. Either works once and expires in ${minutes} minutes.</p>
  <p style="color: #6b6862; font-size: 13px;">If you didn't ask to sign in, ignore this email. Nobody can sign in without it.</p>
</div>`;
  return { subject, text, html };
}

let transport: Transporter | undefined;

export async function sendSignInEmail(to: string, content: { subject: string; text: string; html: string }) {
  const env = serverEnv();
  if (!env.SMTP_PASSWORD) {
    // Local development without a mailbox: the code goes to the server log instead.
    if (process.env.NODE_ENV === "production") throw new Error("SMTP_PASSWORD is not set");
    console.info(`[dev] sign-in email for ${to}:\n${content.text}`);
    return;
  }
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
  await transport.sendMail({ from: env.MAIL_FROM ?? `"${APP_NAME}" <${env.SMTP_USER}>`, to, ...content });
}
