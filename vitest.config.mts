import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "evals/**/*.test.ts", "privacy/**/*.test.mjs"],
    exclude: ["**/node_modules/**"],
    environment: "node",
  },
});
