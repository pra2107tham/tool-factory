import { ImageResponse } from "next/og";

export const alt = "Image Format Converter — PNG, JPG, WebP, AVIF in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CHIPS = ["PNG", "JPG", "WebP", "AVIF"];

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
          backgroundColor: "#F2F5F9",
          color: "#16202B",
        }}
      >
        {/* The format chips on a transparency checkerboard — the tool in one glance.
            Satori has no conic-gradient, so the checkerboard is 96 squares. */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 720,
            height: 132,
            marginBottom: 44,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: "#E9EEF4",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              display: "flex",
              flexWrap: "wrap",
              width: 720,
              height: 132,
            }}
          >
            {Array.from({ length: 96 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 45,
                  height: 33,
                  backgroundColor:
                    (i % 16) % 2 === Math.floor(i / 16) % 2 ? "#C9D4E0" : "#E9EEF4",
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: 20,
            }}
          >
            {CHIPS.map((chip, i) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 150,
                  height: 72,
                  borderRadius: 12,
                  fontSize: 34,
                  fontWeight: 600,
                  border: "3px solid #16202B",
                  backgroundColor: i === 2 ? "#D6246E" : "#FFFFFF",
                  color: i === 2 ? "#FFFFFF" : "#16202B",
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 62, fontWeight: 600, textAlign: "center" }}>
          Image Format Converter
        </div>
        <div style={{ fontSize: 28, marginTop: 16, color: "#4C5A69" }}>
          Pick a format, download in seconds — nothing uploaded
        </div>
        <div style={{ fontSize: 22, marginTop: 40, color: "#D6246E" }}>Tool Factory</div>
      </div>
    ),
    { ...size }
  );
}
