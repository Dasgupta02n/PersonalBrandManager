import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth/session";
import { serverEnv } from "@/lib/config/env";

export async function POST() {
  await endSession();
  // The configured site, not the request's host: behind the proxy they can differ.
  return NextResponse.redirect(new URL("/", serverEnv().APP_URL), { status: 303 });
}
