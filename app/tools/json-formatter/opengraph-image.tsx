import { ImageResponse } from "next/og";

export const alt = "JSON Formatter — validate and pretty-print JSON online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The card is the tool: the slate panel with the amber status bar mid-catch.
const INK = "#0F172A";
const RULE = "#1E293B";
const CODE = "#E2E8F0";
const MUTED = "#8FA3BC";
const INVALID = "#FBBF24";

const LINES = ['{', '  "id": 4021,', '  "user": "ada"', '  "active": true', '}'];
const ERROR_LINE = 3; // the missing comma

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
        <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.1 }}>JSON Formatter</div>
        <div style={{ fontSize: 28, marginTop: 16, color: "#5A6572" }}>
          Pretty-print, validate, and find the exact line that broke.
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 36,
            borderRadius: 18,
            backgroundColor: INK,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 24px",
              borderBottom: `2px solid ${RULE}`,
            }}
          >
            <div
              style={{ width: 16, height: 16, borderRadius: 999, backgroundColor: INVALID }}
            />
            <div style={{ fontSize: 24, color: INVALID }}>Invalid JSON</div>
            <div style={{ fontSize: 22, color: MUTED }}>Line 3, column 18</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", padding: "16px 0" }}>
            {LINES.map((line, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", height: 42 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    width: 76,
                    paddingRight: 18,
                    fontSize: 24,
                    color: i + 1 === ERROR_LINE ? INK : MUTED,
                    backgroundColor: i + 1 === ERROR_LINE ? INVALID : "transparent",
                    height: 42,
                    alignItems: "center",
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontSize: 26, color: CODE, paddingLeft: 18 }}>{line}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", marginTop: 24, fontSize: 22, color: "#5A6572" }}>
          Runs entirely in your browser
          <div style={{ marginLeft: "auto", color: "#111418" }}>Tool Factory</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
