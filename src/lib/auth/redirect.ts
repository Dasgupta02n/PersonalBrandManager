// Where to send someone after sign-in. Only paths inside this app are allowed, so a crafted
// link can never bounce a user to another site.

/** A path inside this app, or /today. */
export function safePath(value: unknown): string {
  const next = typeof value === "string" ? value : "";
  const inside =
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/auth/") &&
    // Browsers read a backslash as a slash ("/\evil.example" is another site); no control characters.
    !/[\\\u0000-\u001f]/.test(next);
  return inside && next.length <= 512 ? next : "/today";
}
