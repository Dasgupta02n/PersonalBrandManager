import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The quality bar (`npm run eval`): real model calls, so it runs separately from `npm test`.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./evals/shims/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["evals/**/*.eval.ts"],
    environment: "node",
    testTimeout: 6 * 60 * 60 * 1000,
    env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "eval" },
    reporters: ["verbose"],
  },
});
