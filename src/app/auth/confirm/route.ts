import { NextResponse, type NextRequest } from "next/server";
import { landingFrom } from "@/lib/auth/redirect";
import { serverEnv } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Completes sign-in from the link in the sign-in email. Unlike /auth/callback it needs nothing
 * stored in the browser that asked for the email, so the link works wherever it is opened (an
 * email app's own browser, another device). The email template sends `token_hash`, `type` and
 * `redirect_to` (the callback address with the page to land on).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // The configured site, not the request's host: behind the proxy they can differ.
  const origin = new URL(serverEnv().APP_URL).origin;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (tokenHash && (type === "email" || type === "magiclink" || type === "signup")) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(landingFrom(searchParams.get("redirect_to"), origin), origin));
  }
  return NextResponse.redirect(new URL("/login?error=link", origin));
}
