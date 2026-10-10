import type { NextConfig } from "next";

// Cache Components is intentionally off: nearly every page is per-user and rendered on request
// (see docs/ARCHITECTURE.md). Revisit when public marketing pages grow.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
