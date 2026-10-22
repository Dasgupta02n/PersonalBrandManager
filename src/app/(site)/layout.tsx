import type { Viewport } from "next";
import { SiteEffects } from "@/components/site/effects";
import { siteFonts } from "../fonts";
import "./site.css";

// The public site: home, product and trust pages, the free check and sign-in. Its look lives in
// site.css; the signed-in app keeps its own theme.

export const viewport: Viewport = { themeColor: "#07070d" };

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={`${siteFonts} flex min-h-full flex-1 flex-col`}>
      {children}
      <SiteEffects />
    </div>
  );
}
