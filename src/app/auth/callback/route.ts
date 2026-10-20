import { NextResponse, type NextRequest } from "next/server";
import { safePath } from "@/lib/auth/redirect";
import { serverEnv } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Completes sign-in from links that carry a code, by exchanging it for a session. Works only in the
 * browser that asked for the email; links from our own email template go to /auth/confirm instead.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // The configured site, not the request's host: behind the proxy they can differ.
  const origin = new URL(serverEnv().APP_URL).origin;
  const code = searchParams.get("code");
  const next = safePath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/login?error=callback", origin));
}
