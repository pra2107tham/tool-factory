export type Level = "L" | "M" | "Q" | "H";

/** Prefilled so a real, scannable code is on screen before the first keystroke. */
export const EXAMPLE = "https://tool-factory-lac.vercel.app/tools/qr-code-generator";

/** The one look every code here gets: ink on paper, which is what scanners expect. */
export const COLOR = { dark: "#111418", light: "#FFFFFF" };

export const LEVELS: { id: Level; recovers: string }[] = [
  { id: "L", recovers: "7%" },
  { id: "M", recovers: "15%" },
  { id: "Q", recovers: "25%" },
  { id: "H", recovers: "30%" },
];

/** Print-safe PNG sizes, in pixels square. 512 for slides, 2048 for posters. */
export const PNG_SIZES = [512, 1024, 2048];

/**
 * The four-module quiet zone the QR spec asks for. Scanners use it to find the
 * code's edge — trimming it is the quiet reason a code "sometimes" won't read.
 */
export const QUIET_ZONE = 4;

/**
 * A filename someone can find again in their Downloads folder: derived from the
 * content, not "qrcode(3).png".
 */
export function fileName(text: string, ext: string) {
  const slug = text
    .trim()
    .replace(/^[a-z]+:\/\//i, "") // the protocol tells you nothing
    .replace(/^www\./i, "")
    .slice(0, 40)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `qr-${slug}.${ext}` : `qr-code.${ext}`;
}
