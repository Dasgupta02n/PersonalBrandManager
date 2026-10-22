import { ImageResponse } from "next/og";
import { APP_NAME } from "@/lib/config/app";

export const alt = `${APP_NAME}: a private record of your work, and LinkedIn posts you won't regret`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const tile = (background: string, opacity = 1) => ({ width: 30, height: 30, borderRadius: 8, background, opacity });

/** The share card shown when a page is posted on LinkedIn and elsewhere. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        color: "#f3f3f8",
        background: "#07070d",
        backgroundImage:
          "radial-gradient(circle at 12% 18%, rgba(124,108,255,0.45), transparent 42%), radial-gradient(circle at 92% 8%, rgba(242,181,68,0.32), transparent 40%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: 16,
            borderRadius: 22,
            background: "#14141f",
            border: "2px solid rgba(255,255,255,0.12)",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <div style={tile("#ffffff", 0.92)} />
            <div style={tile("#f2b544")} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={tile("#ffffff", 0.5)} />
            <div style={tile("#ffffff", 0.26)} />
          </div>
        </div>
        <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1.5 }}>{APP_NAME}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 90, letterSpacing: -3.5, lineHeight: 1.04 }}>
          <div style={{ display: "flex" }}>
            Nothing you&apos;ll<span style={{ color: "#f6c25b", marginLeft: 24 }}>regret</span>
          </div>
          <div style={{ display: "flex" }}>posting.</div>
        </div>
        <div style={{ fontSize: 29, color: "#a6a6bc", maxWidth: 940, lineHeight: 1.4 }}>
          A private record of your work, and LinkedIn drafts checked for confidential details, boastful phrasing and job-hunt
          signals.
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 24, color: "#a6a6bc" }}>
        <span>Never touches your LinkedIn</span>
        <span style={{ color: "#f2b544" }}>·</span>
        <span>You approve everything</span>
        <span style={{ color: "#f2b544" }}>·</span>
        <span>Free during the beta</span>
      </div>
    </div>,
    size,
  );
}
