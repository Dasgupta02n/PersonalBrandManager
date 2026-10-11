import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { parseServerEnv } = await import("./env");

const required = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

describe("parseServerEnv", () => {
  it("treats empty optional values as unset", () => {
    const env = parseServerEnv({ ...required, SUPABASE_SECRET_KEY: "", ANTHROPIC_API_KEY: "", CRON_SECRET: "" });
    expect(env.SUPABASE_SECRET_KEY).toBeUndefined();
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.CRON_SECRET).toBeUndefined();
  });

  it("defaults an empty APP_URL", () => {
    expect(parseServerEnv({ ...required, APP_URL: "" }).APP_URL).toBe("http://localhost:3000");
  });

  it("rejects missing required values, naming them", () => {
    expect(() => parseServerEnv({ SUPABASE_URL: "", SUPABASE_PUBLISHABLE_KEY: "x" })).toThrow("SUPABASE_URL");
  });

  it("rejects a short cron secret", () => {
    expect(() => parseServerEnv({ ...required, CRON_SECRET: "short" })).toThrow("CRON_SECRET");
  });
});
