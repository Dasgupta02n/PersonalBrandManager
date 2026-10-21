import "server-only";
import { requireEnv, serverEnv } from "@/lib/config/env";
import { asService, type Tx } from "@/lib/db/client";
import { sendSignInEmail, signInEmail } from "./mail";
import { keyedHash, newCode, newToken, sameHash } from "./tokens";

// Email-only sign-in. One email holds a 6-digit code and a link; either signs in once.
// The first sign-in creates the account (the database adds an empty profile and the beta plan).

export const CODE_MINUTES = 15;
const MAX_ATTEMPTS = 5; // wrong codes per email before it stops working
const MAX_FAILURES_PER_HOUR = 10; // wrong codes per address across all its emails
const EMAILS_PER_HOUR = 5; // per address
const EMAILS_PER_IP_HOUR = 20;

export type SendResult = { ok: true } | { ok: false; reason: "too_soon" | "too_many" | "send_failed" };
export type VerifyResult = { ok: true; userId: string; next: string } | { ok: false; reason: "expired" | "wrong" | "locked" };

type Send = typeof sendSignInEmail;

/** Rate-limits, stores the hashed code and link, and sends the email. */
export async function requestSignIn(
  { email, next, ip }: { email: string; next: string; ip: string | null },
  send: Send = sendSignInEmail,
): Promise<SendResult> {
  const secret = requireEnv("AUTH_SECRET");
  const code = newCode();
  const link = newToken();
  const ipHash = ip ? keyedHash(secret, "ip", ip) : null;

  const stored = await asService(async (tx) => {
    const [byEmail] = await tx`
      select count(*) filter (where created_at > now() - interval '1 minute')::int as minute, count(*)::int as hour
      from sign_in_codes where lower(email) = ${email} and created_at > now() - interval '1 hour'`;
    if (byEmail.minute > 0) return "too_soon" as const;
    if (byEmail.hour >= EMAILS_PER_HOUR) return "too_many" as const;
    if (ipHash) {
      const [byIp] = await tx`
        select count(*)::int as n from sign_in_codes where ip_hash = ${ipHash} and created_at > now() - interval '1 hour'`;
      if (byIp.n >= EMAILS_PER_IP_HOUR) return "too_many" as const;
    }
    await tx`delete from sign_in_codes where created_at < now() - interval '1 day'`;
    const [row] = await tx`
      insert into sign_in_codes (email, code_hash, link_hash, next_path, ip_hash, expires_at)
      values (${email}, ${keyedHash(secret, "code", `${email}:${code}`)}, ${keyedHash(secret, "link", link)}, ${next}, ${ipHash},
        now() + make_interval(mins => ${CODE_MINUTES}))
      returning id`;
    return row.id as string;
  });
  if (stored === "too_soon" || stored === "too_many") return { ok: false, reason: stored };

  const base = serverEnv().APP_URL.replace(/\/$/, "");
  try {
    await send(email, signInEmail({ code, link: `${base}/auth/confirm?token=${link}`, minutes: CODE_MINUTES }));
  } catch (err) {
    console.error("sign-in email failed:", err instanceof Error ? err.message : err);
    // Not sent, so it shouldn't count against the address's limits.
    await asService((tx) => tx`delete from sign_in_codes where id = ${stored}`);
    return { ok: false, reason: "send_failed" };
  }
  return { ok: true };
}

async function signInAs(tx: Tx, email: string): Promise<string> {
  const [user] = await tx`
    insert into users (email, last_sign_in_at) values (${email}, now())
    on conflict ((lower(email))) do update set last_sign_in_at = now()
    returning id`;
  return user.id;
}

/** Checks the code from the latest email to this address. */
export async function verifyCode(email: string, code: string, next: string): Promise<VerifyResult> {
  const secret = requireEnv("AUTH_SECRET");
  return asService(async (tx) => {
    const [failures] = await tx`
      select coalesce(sum(attempts), 0)::int as n from sign_in_codes
      where lower(email) = ${email} and created_at > now() - interval '1 hour'`;
    if (failures.n >= MAX_FAILURES_PER_HOUR) return { ok: false, reason: "locked" } as const;

    const [row] = await tx`
      select id, code_hash, attempts from sign_in_codes
      where lower(email) = ${email} and consumed_at is null and expires_at > now()
      order by created_at desc limit 1 for update`;
    if (!row) return { ok: false, reason: "expired" } as const;
    if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "locked" } as const;

    if (!sameHash(row.code_hash, keyedHash(secret, "code", `${email}:${code}`))) {
      await tx`update sign_in_codes set attempts = attempts + 1 where id = ${row.id}`;
      return { ok: false, reason: row.attempts + 1 >= MAX_ATTEMPTS ? "locked" : "wrong" } as const;
    }
    await tx`update sign_in_codes set consumed_at = now() where id = ${row.id}`;
    return { ok: true, userId: await signInAs(tx, email), next } as const;
  });
}

/** Uses the link from a sign-in email. */
export async function verifyLink(token: string): Promise<VerifyResult> {
  if (!token || token.length > 100) return { ok: false, reason: "expired" };
  const secret = requireEnv("AUTH_SECRET");
  return asService(async (tx) => {
    const [row] = await tx`
      update sign_in_codes set consumed_at = now()
      where link_hash = ${keyedHash(secret, "link", token)} and consumed_at is null and expires_at > now()
      returning email, next_path`;
    if (!row) return { ok: false, reason: "expired" } as const;
    return { ok: true, userId: await signInAs(tx, row.email), next: row.next_path } as const;
  });
}
