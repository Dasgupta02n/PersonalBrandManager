import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

// Sign-in codes, sign-in links and session tokens are stored only as keyed hashes (HMAC-SHA256
// with AUTH_SECRET). A copy of the database alone can't be used to sign in as anyone.

export type HashPurpose = "code" | "link" | "session" | "ip";

export function keyedHash(secret: string, purpose: HashPurpose, value: string): string {
  return createHmac("sha256", secret).update(`${purpose}:${value}`).digest("base64url");
}

/** A 6-digit code, zero-padded. */
export function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** 32 random bytes, URL-safe: for sign-in links and session cookies. */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Compares two hashes in constant time. */
export function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
