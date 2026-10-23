import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import robots, { PRIVATE_PATHS } from "@/app/robots";
import sitemap from "@/app/sitemap";
import { jsonLdString } from "@/components/public-shell";
import { PRICES, TRIAL_DAYS } from "@/lib/billing/pricing";
import { FACTS, PUBLIC_PAGES, SITE_URL, absoluteUrl } from "./site";

// Public pages live in the (site) route group, which doesn't appear in their URLs.
const appDir = join(__dirname, "..", "..", "app", "(site)");

describe("public site", () => {
  it("has a real page for every entry in the site map", () => {
    for (const page of PUBLIC_PAGES) {
      const file = page.path === "/" ? join(appDir, "page.tsx") : join(appDir, page.path.slice(1), "page.tsx");
      expect(existsSync(file), page.path).toBe(true);
    }
  });

  it("lists every public page in sitemap.xml with an absolute URL and a real date", () => {
    const entries = sitemap();
    expect(entries.map((e) => e.url)).toEqual(PUBLIC_PAGES.map((p) => absoluteUrl(p.path)));
    for (const entry of entries) {
      expect(entry.url.startsWith(SITE_URL)).toBe(true);
      expect(Number.isNaN(new Date(entry.lastModified!).getTime())).toBe(false);
    }
  });

  it("lets every crawler read the public site and keeps the app out", () => {
    const rules = robots().rules;
    const list = Array.isArray(rules) ? rules : [rules];
    expect(list).toHaveLength(1);
    expect(list[0].userAgent).toBe("*");
    expect(list[0].allow).toBe("/");
    for (const path of ["/today", "/wins", "/drafts", "/network", "/account", "/auth/", "/api/"]) expect(PRIVATE_PATHS).toContain(path);
    for (const page of PUBLIC_PAGES) {
      expect(PRIVATE_PATHS.some((p) => page.path === p || page.path.startsWith(p))).toBe(false);
    }
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("states the real price in the facts block", () => {
    const price = FACTS.find((f) => f.label === "Price")!.value;
    expect(price).toContain(`$${PRICES.monthly.usd} a month`);
    expect(price).toContain(`first ${TRIAL_DAYS} days`);
    expect(price).toContain(`$${PRICES.annual.usd} a year`);
  });

  it("escapes structured data so text can't close the script tag", () => {
    const out = jsonLdString({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
