import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { requireEnv, serverEnv } from "@/lib/config/env";

/**
 * Supabase client bound to the current request's session (row-level security applies).
 * Create a new one per request; never share across requests.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const env = serverEnv();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Service-role client that bypasses row-level security. Only for trusted server code
 * (scheduler, webhooks, usage logging). Never use it with user-supplied ids without checks.
 */
export function createAdminClient() {
  const env = serverEnv();
  return createAdminSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, requireEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Returns the signed-in user, or null. Verifies the token with Supabase Auth. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
