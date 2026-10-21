import { APP_NAME, APP_PROMISE } from "@/lib/config/app";
import { FACTS, PUBLIC_PAGES, SITE_DESCRIPTION, absoluteUrl } from "@/lib/config/site";

export const dynamic = "force-static";

/** A short guide for AI tools (llmstxt.org format), built from the same facts as the site. */
export function GET() {
  const lines = [
    `# ${APP_NAME}`,
    "",
    `> ${APP_PROMISE} ${SITE_DESCRIPTION}`,
    "",
    ...FACTS.map((f) => `- ${f.label}: ${f.value}`),
    "",
    "## Pages",
    "",
    ...PUBLIC_PAGES.filter((p) => p.path !== "/site-map").map((p) => `- [${p.path === "/" ? "Home" : p.title}](${absoluteUrl(p.path)})`),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
