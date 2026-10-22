import type { Viewport } from "next";
import { SiteEffects } from "@/components/site/effects";
import "./site.css";

// The public site: home, product and trust pages, the free check and sign-in. Light only; its
// look lives in site.css on the shared tokens.

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="site flex min-h-full flex-1 flex-col">
      {children}
      <SiteEffects />
    </div>
  );
}
