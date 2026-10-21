import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config/site";

/** Signed-in pages; they also redirect to sign-in and carry noindex. */
export const PRIVATE_PATHS = ["/today", "/wins", "/drafts", "/engage", "/onboarding", "/account", "/consent", "/style", "/auth/", "/api/"];

/**
 * One group for every crawler, search engines and AI assistants alike: the public site is open so
 * it can be found and cited; the app itself is not. (A named group would replace this one for
 * that bot, so any added later must repeat the disallows.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE_PATHS }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
