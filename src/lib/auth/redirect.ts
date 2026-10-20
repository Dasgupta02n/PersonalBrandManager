// Where to send someone after sign-in. Only paths inside this app are allowed, so a crafted
// link can never bounce a user to another site.

/** A path inside this app, or /today. */
export function safePath(value: unknown): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/auth/") ? next : "/today";
}

/**
 * The page to land on from the sign-in email's `redirect_to`, which carries our callback address
 * with the page in its `next` parameter. Anything pointing at another site lands on /today.
 */
export function landingFrom(redirectTo: string | null, origin: string): string {
  try {
    const target = new URL(redirectTo ?? "", origin);
    if (target.origin !== origin) return "/today";
    return safePath(target.searchParams.get("next"));
  } catch {
    return "/today";
  }
}
