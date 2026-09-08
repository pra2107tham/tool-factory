import { ImageResponse } from "next/og";

export const alt = "Word Counter — live word, character and reading time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The card is the tool: the same stat strip you land on, with real numbers.
const STATS = [
  ["Words", "1,204"],
  ["Characters", "6,918"],
  ["No spaces", "5,731"],
  ["Sentences", "63"],
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          backgroundColor: "#F3F1EC",
          color: "#111418",
        }}
      >
        <div style={{ fontSize: 68, fontWeight: 600, lineHeight: 1.1 }}>Word Counter</div>
        <div style={{ fontSize: 30, marginTop: 18, color: "#5A6572" }}>
          Live word, character and reading time — as you type.
        </div>

        <div style={{ display: "flex", gap: 20, marginTop: 44 }}>
          {STATS.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                padding: "22px 24px",
                borderRadius: 16,
                border: "3px solid #111418",
                backgroundColor: "#FFFFFF",
              }}
            >
              <div style={{ fontSize: 46, fontWeight: 600 }}>{value}</div>
              <div style={{ fontSize: 22, marginTop: 6, color: "#5A6572" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 40 }}>
          <div
            style={{
              display: "flex",
              width: 520,
              height: 18,
              borderRadius: 999,
              backgroundColor: "#E2DED4",
            }}
          >
            <div
              style={{ display: "flex", width: 300, borderRadius: 999, backgroundColor: "#2F5FE0" }}
            />
          </div>
          <div style={{ fontSize: 26, color: "#111418" }}>about 6 min read</div>
          <div style={{ fontSize: 22, marginLeft: "auto", color: "#2F5FE0" }}>Tool Factory</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
