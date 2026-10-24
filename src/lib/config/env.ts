import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  APP_URL: z.url().default("http://localhost:3000"),
  /** The app's login (pbm_app) on our own PostgreSQL. */
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "must be a postgres:// URL"),
  /** Keys the hashes of sign-in codes, links and session tokens. 32 characters or more. */
  AUTH_SECRET: z.string().min(32),
  /** Sign-in emails. Without SMTP_PASSWORD, development prints the code to the server log. */
  SMTP_HOST: z.string().min(1).default("smtp.hostinger.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_USER: z.string().min(1).default("hello@winwall.app"),
  SMTP_PASSWORD: z.string().min(1).optional(),
  /** Sender shown in the inbox; defaults to the product name and SMTP_USER. */
  MAIL_FROM: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
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
