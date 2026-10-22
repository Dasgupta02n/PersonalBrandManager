import { Schibsted_Grotesk } from "next/font/google";

// One typeface for the whole product, site and app alike (docs/DESIGN.md). Self-hosted by Next.js
// at build time, so no font request leaves our server. latin-ext carries the ₹ sign.
export const schibsted = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-schibsted",
  display: "swap",
});
