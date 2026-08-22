import { ImageResponse } from "next/og";

export const alt = "Tool Factory — one small tool, shipped every day";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F6F5F1",
          color: "#1B2430",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 600 }}>Tool Factory</div>
        <div style={{ fontSize: 28, marginTop: 16, color: "#5B6472" }}>
          One small tool, shipped every day
        </div>
      </div>
    ),
    { ...size }
  );
}
