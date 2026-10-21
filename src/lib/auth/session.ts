import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { requireEnv, serverEnv } from "@/lib/config/env";
import { asService } from "@/lib/db/client";
import { SESSION_COOKIE, SESSION_DAYS, sessionCookieOptions } from "./cookie";
import { keyedHash, newToken } from "./tokens";

// Sessions: the cookie holds a random token; the database holds its keyed hash, the user and an
// expiry that moves forward with use (at most once a day). Signing out deletes the row, so a
// copied cookie stops working everywhere.

export interface SessionUser {
  id: string;
  email: string;
  created_at: string;
}

const hashOf = (token: string) => keyedHash(requireEnv("AUTH_SECRET"), "session", token);

/** Starts a session for this user and sets the cookie. Only in server actions and route handlers. */
export async function startSession(userId: string): Promise<void> {
  const token = newToken();
  await asService(
    (tx) => tx`insert into sessions (token_hash, user_id, expires_at)
      values (${hashOf(token)}, ${userId}, now() + make_interval(days => ${SESSION_DAYS}))`,
  );
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(serverEnv().APP_URL));
}

/** The signed-in user, or null. Looked up once per request. */
export const currentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const hash = hashOf(token);
  return asService(async (tx) => {
    const [row] = await tx`
      select u.id, u.email, u.created_at, s.last_seen_at < now() - interval '1 day' as stale
      from sessions s join users u on u.id = s.user_id
      where s.token_hash = ${hash} and s.expires_at > now()`;
    if (!row) return null;
    if (row.stale) {
      await tx`update sessions set last_seen_at = now(), expires_at = now() + make_interval(days => ${SESSION_DAYS})
        where token_hash = ${hash}`;
    }
    return { id: row.id, email: row.email, created_at: row.created_at };
  });
});

/** Ends this browser's session. Only in server actions and route handlers. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && token.length <= 100) await asService((tx) => tx`delete from sessions where token_hash = ${hashOf(token)}`);
  store.delete(SESSION_COOKIE);
}
