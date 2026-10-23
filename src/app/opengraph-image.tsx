import { ImageResponse } from "next/og";
import { APP_NAME, APP_PROMISE } from "@/lib/config/app";

export const alt = `${APP_NAME}: ready for your next role, without looking like you're looking`;
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
        padding: "64px 80px 56px",
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
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 64, letterSpacing: -2, lineHeight: 1.08, maxWidth: 960 }}>{APP_PROMISE}</div>
        <div style={{ fontSize: 26, color: "#51555f", maxWidth: 940, lineHeight: 1.4 }}>
          A private record of your work, LinkedIn posts checked before anyone at work sees them, and a quiet network of the search
          firms and people who bring the next role.
        </div>
      </div>
      <div style={{ display: "flex", borderTop: "2px solid #e4e6eb", paddingTop: 24, fontSize: 24, color: "#51555f", gap: 36 }}>
        <span>Never touches your LinkedIn</span>
        <span>You send and post everything</span>
        <span>Free during the beta</span>
      </div>
    </div>,
    size,
  );
}
