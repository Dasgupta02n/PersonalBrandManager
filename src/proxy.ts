import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/cookie";

/** Routes that require a signed-in user. */
const PROTECTED_PREFIXES = ["/today", "/wins", "/drafts", "/engage", "/network", "/onboarding", "/account", "/consent", "/style"];

/**
 * Sends visitors without a session cookie from app pages to sign-in, and keeps an active
 * session's cookie alive. Only the cookie's presence is checked here: every page and server
 * action checks the session itself in the database.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!token) {
    if (!isProtected) return NextResponse.next();
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(process.env.APP_URL));
  return response;
}

export const config = {
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
