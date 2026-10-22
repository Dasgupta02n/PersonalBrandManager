import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// The brick wall from the logo, scaled to 180px: courses of 28px with 8px joints.
const brick = (width: number, bright = false) => ({
  width,
  height: 28,
  borderRadius: 7,
  background: "#ffffff",
  opacity: bright ? 1 : 0.5,
});

/** Home-screen icon: the brick wall on ink, full bleed (iOS rounds the corners itself). */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#111419",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={brick(46)} />
          <div style={brick(46, true)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={brick(19)} />
          <div style={brick(46)} />
          <div style={brick(19)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={brick(46)} />
          <div style={brick(46)} />
        </div>
      </div>
    </div>,
    size,
  );
}
