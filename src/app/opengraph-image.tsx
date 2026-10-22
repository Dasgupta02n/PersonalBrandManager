import { ImageResponse } from "next/og";
import { APP_NAME, APP_PROMISE } from "@/lib/config/app";

export const alt = `${APP_NAME}: a private record of your work, and LinkedIn posts you won't regret`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The brick wall from the logo at 56px.
const brick = (width: number, bright = false) => ({
  width,
  height: 9,
  borderRadius: 2,
  background: "#ffffff",
  opacity: bright ? 1 : 0.5,
});

/** The share card shown when a page is posted on LinkedIn and elsewhere: white, ink, one rule. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        color: "#111419",
        background: "#ffffff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: "#111419",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}
        >
          <div style={{ display: "flex", gap: 3 }}>
            <div style={brick(14)} />
            <div style={brick(14, true)} />
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            <div style={brick(5.5)} />
            <div style={brick(14)} />
            <div style={brick(5.5)} />
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            <div style={brick(14)} />
            <div style={brick(14)} />
          </div>
        </div>
        <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>{APP_NAME}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ fontSize: 88, letterSpacing: -3, lineHeight: 1.04, maxWidth: 900 }}>{APP_PROMISE}</div>
        <div style={{ fontSize: 30, color: "#51555f", maxWidth: 940, lineHeight: 1.4 }}>
          A private record of your work, and LinkedIn drafts checked for client names, unannounced numbers, boastful phrasing and
          job-hunt signals.
        </div>
      </div>
      <div style={{ display: "flex", borderTop: "2px solid #e4e6eb", paddingTop: 24, fontSize: 24, color: "#51555f", gap: 36 }}>
        <span>Never touches your LinkedIn</span>
        <span>You approve everything</span>
        <span>Free during the beta</span>
      </div>
    </div>,
    size,
  );
}
