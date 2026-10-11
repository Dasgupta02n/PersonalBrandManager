import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the seal on ink, full bleed (iOS rounds the corners itself). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#17161a" }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            border: "14px solid #faf8f3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 18, background: "#b08d57" }} />
        </div>
      </div>
    ),
    size,
  );
}
