import { ImageResponse } from "next/og";

export const alt = "Background Remover — free, private, no upload";
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
          backgroundColor: "#F1EFFB",
          color: "#2A1E5C",
        }}
      >
        {/* A photo, half wiped back to a transparency checkerboard — the tool in one glance. */}
        <div
          style={{
            display: "flex",
            width: 260,
            height: 150,
            marginBottom: 44,
            borderRadius: 12,
            overflow: "hidden",
            border: "4px solid #2A1E5C",
          }}
        >
          <div style={{ display: "flex", width: 130, height: "100%", backgroundColor: "#8B93A6" }} />
          <div style={{ display: "flex", width: 4, height: "100%", backgroundColor: "#F4B740" }} />
          {/* Satori has no conic-gradient, so the checkerboard is 42 squares. */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              width: 126,
              height: "100%",
              backgroundColor: "#EDEFF4",
            }}
          >
            {Array.from({ length: 42 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 21,
                  height: 25,
                  backgroundColor:
                    (i % 6) % 2 === Math.floor(i / 6) % 2 ? "#C7CBD6" : "#EDEFF4",
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ fontSize: 66, fontWeight: 600, textAlign: "center" }}>
          Remove the background
        </div>
        <div style={{ fontSize: 28, marginTop: 16, color: "#4A4560" }}>
          One photo, one click — nothing leaves your browser
        </div>
        <div style={{ fontSize: 22, marginTop: 40, color: "#5B3DF5" }}>Tool Factory</div>
      </div>
    ),
    { ...size }
  );
}
