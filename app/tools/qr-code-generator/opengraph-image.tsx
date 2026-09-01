import { ImageResponse } from "next/og";
import QRCode from "qrcode";

export const alt = "QR Code Generator — PNG and SVG, made in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A real, scannable code pointing at this page — the card is the demo.
const TARGET = "https://tool-factory-lac.vercel.app/tools/qr-code-generator";

export default async function Image() {
  const svg = await QRCode.toString(TARGET, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark: "#111418", light: "#FFFFFF" },
  });
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: 72,
          backgroundColor: "#F3F1EC",
          color: "#111418",
        }}
      >
        <div
          style={{
            display: "flex",
            padding: 16,
            borderRadius: 20,
            border: "4px solid #111418",
            backgroundColor: "#FFFFFF",
          }}
        >
          {/* Satori renders this, not the DOM — next/image has no part in it. */}
          <img src={src} width={340} height={340} alt="" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 68, fontWeight: 600, lineHeight: 1.1 }}>
            QR Code Generator
          </div>
          <div style={{ fontSize: 30, marginTop: 20, color: "#5A6572", lineHeight: 1.35 }}>
            Type a link, download a PNG or SVG. Free, no sign-up, never expires.
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 36 }}>
            {["PNG", "SVG", "L M Q H"].map((chip) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "3px solid #111418",
                  backgroundColor: "#FFFFFF",
                  fontSize: 26,
                  fontWeight: 600,
                }}
              >
                {chip}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 22, marginTop: 40, color: "#FF5A1F" }}>Tool Factory</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
