import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { parseServerEnv } = await import("./env");

const required = {
  DATABASE_URL: "postgres://pbm_app:secret@db:5432/pbm",
  AUTH_SECRET: "a".repeat(32),
};

describe("parseServerEnv", () => {
  it("treats empty optional values as unset", () => {
    const env = parseServerEnv({ ...required, SMTP_PASSWORD: "", OPENROUTER_API_KEY: "", CRON_SECRET: "" });
    expect(env.SMTP_PASSWORD).toBeUndefined();
    expect(env.OPENROUTER_API_KEY).toBeUndefined();
    expect(env.CRON_SECRET).toBeUndefined();
  });

  it("defaults an empty APP_URL and the mail server", () => {
    const env = parseServerEnv({ ...required, APP_URL: "", SMTP_PORT: "" });
    expect(env.APP_URL).toBe("http://localhost:3000");
    expect(env.SMTP_HOST).toBe("smtp.hostinger.com");
    expect(env.SMTP_PORT).toBe(465);
  });

  it("rejects missing required values, naming them", () => {
    expect(() => parseServerEnv({ DATABASE_URL: "", AUTH_SECRET: "a".repeat(32) })).toThrow("DATABASE_URL");
  });

  it("rejects a database URL that isn't postgres", () => {
    expect(() => parseServerEnv({ ...required, DATABASE_URL: "https://example.com" })).toThrow("DATABASE_URL");
  });

  it("rejects short secrets", () => {
    expect(() => parseServerEnv({ ...required, AUTH_SECRET: "short" })).toThrow("AUTH_SECRET");
    expect(() => parseServerEnv({ ...required, CRON_SECRET: "short" })).toThrow("CRON_SECRET");
  });
});
