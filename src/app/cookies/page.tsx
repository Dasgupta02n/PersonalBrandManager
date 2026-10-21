import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/public-shell";
import { SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth/cookie";
import { APP_NAME } from "@/lib/config/app";

export const metadata: Metadata = {
  title: "Cookies",
  description: `${APP_NAME} uses one cookie, to keep you signed in. No tracking, advertising or analytics cookies, so there is no cookie banner.`,
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <InfoPage
      path="/cookies"
      title="Cookies"
      updated="2026-10-22"
      intro={
        <p>
          {APP_NAME} uses one cookie, and only after you sign in: it keeps you signed in. There are no tracking, advertising or analytics
          cookies, which is why you never see a cookie banner here.
        </p>
      }
    >
      <InfoSection title="The one cookie">
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[560px] border-collapse text-left text-[15px]">
            <thead className="bg-surface">
              <tr>
                {["Name", "Purpose", "Lasts", "Type"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-4 py-3 font-mono">{SESSION_COOKIE}</td>
                <td className="px-4 py-3">Keeps you signed in. Holds a random token; we store only a scrambled version of it.</td>
                <td className="px-4 py-3">{SESSION_DAYS} days, renewed while you use it; deleted when you sign out</td>
                <td className="px-4 py-3">Strictly necessary, first party</td>
              </tr>
            </tbody>
          </table>
        </div>
      </InfoSection>
      <InfoSection title="Nothing else">
        <ul>
          <li>No analytics, advertising or social media trackers, including LinkedIn&apos;s.</li>
          <li>Fonts are served from our own server, so visiting this site tells no other company you were here.</li>
          <li>If we ever add anything that needs your consent, we&apos;ll ask first and update this page.</li>
        </ul>
      </InfoSection>
    </InfoPage>
  );
}
