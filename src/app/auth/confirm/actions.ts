"use server";

import { redirect } from "next/navigation";
import { startSession } from "@/lib/auth/session";
import { verifyLink } from "@/lib/auth/sign-in";

/** Uses the link from the sign-in email, then lands on the page the user was heading to. */
export async function confirmSignIn(formData: FormData) {
  const result = await verifyLink(String(formData.get("token") ?? ""));
  if (!result.ok) redirect("/login?error=link");
  await startSession(result.userId);
  redirect(result.next);
}
