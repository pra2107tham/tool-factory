import { ImageResponse } from "next/og";

export const alt = "PDF Splitter — extract pages from a PDF, free";
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
          backgroundColor: "#F4F6F9",
          color: "#0F1B2D",
        }}
      >
        {/* Four pages with the middle two "selected" — the tool in one glance. */}
        <div style={{ display: "flex", gap: 16, marginBottom: 44 }}>
          {[false, true, true, false].map((on, i) => (
            <div
              key={i}
              style={{
                width: 84,
                height: 108,
                borderRadius: 8,
                backgroundColor: "#FFFFFF",
                border: on ? "4px solid #2E6FD9" : "4px solid #E8EDF4",
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 68, fontWeight: 600, textAlign: "center" }}>
          Extract pages from a PDF
        </div>
        <div style={{ fontSize: 28, marginTop: 16, color: "#7A8CA3" }}>
          Pick the pages you want — nothing leaves your browser
        </div>
        <div style={{ fontSize: 22, marginTop: 40, color: "#2E6FD9" }}>Tool Factory</div>
      </div>
    ),
    { ...size }
  );
}
