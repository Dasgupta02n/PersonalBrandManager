import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const tile = (background: string, opacity = 1) => ({ width: 44, height: 44, borderRadius: 12, background, opacity });

/** Home-screen icon: the wall of four tiles, one gold, full bleed (iOS rounds the corners itself). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#14141f" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={tile("#ffffff", 0.92)} />
            <div style={tile("#f2b544")} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={tile("#ffffff", 0.5)} />
            <div style={tile("#ffffff", 0.26)} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
