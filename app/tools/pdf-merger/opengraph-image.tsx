import { ImageResponse } from "next/og";

export const alt = "Merge PDF files free — combine PDFs in your browser";
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
        <div style={{ fontSize: 68, fontWeight: 600, textAlign: "center" }}>
          Merge PDF files
        </div>
        <div style={{ fontSize: 28, marginTop: 16, color: "#5B6472" }}>
          Combine PDFs in any order — nothing leaves your browser
        </div>
        <div style={{ fontSize: 22, marginTop: 40, color: "#0F7B6C" }}>Tool Factory</div>
      </div>
    ),
    { ...size }
  );
}
