// The session cookie, shared by the proxy (which keeps it alive) and the session code.

export const SESSION_COOKIE = "session";
export const SESSION_DAYS = 180;

export function sessionCookieOptions(appUrl: string | undefined) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: appUrl?.startsWith("https://") ?? false,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}
