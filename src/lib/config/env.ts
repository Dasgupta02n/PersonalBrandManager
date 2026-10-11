import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  APP_URL: z.url().default("http://localhost:3000"),
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(16).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/**
 * Validates environment variables. Empty values count as unset: Docker Compose passes
 * `${VAR}` as an empty string when VAR is not configured.
 */
export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const present = Object.fromEntries(Object.entries(source).filter(([, value]) => value !== ""));
  const parsed = serverEnvSchema.safeParse(present);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing or invalid environment variables: ${fields}`);
  }
  return parsed.data;
}

/**
 * Parsed server environment. Parsed lazily so `next build` works without secrets;
 * the first request that needs configuration fails loudly if it is missing.
 */
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}

export function requireEnv<K extends keyof ServerEnv>(key: K): NonNullable<ServerEnv[K]> {
  const value = serverEnv()[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(`Environment variable ${String(key)} is required for this feature`);
  }
  return value as NonNullable<ServerEnv[K]>;
}
