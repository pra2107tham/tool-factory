export type Fmt = {
  mime: string;
  ext: string;
  label: string;
  /** Lossy targets take a quality argument; PNG ignores it entirely. */
  lossy: boolean;
};

export const FORMATS: Fmt[] = [
  { mime: "image/png", ext: "png", label: "PNG", lossy: false },
  { mime: "image/jpeg", ext: "jpg", label: "JPG", lossy: true },
  { mime: "image/webp", ext: "webp", label: "WebP", lossy: true },
  { mime: "image/avif", ext: "avif", label: "AVIF", lossy: true },
];

export function outputName(name: string, ext: string) {
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.${ext}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Plain-language size change, e.g. "72% smaller". */
export function sizeDelta(before: number, after: number) {
  if (before <= 0) return "";
  const change = Math.round(((after - before) / before) * 100);
  if (change === 0) return "same size";
  return change < 0 ? `${-change}% smaller` : `${change}% bigger`;
}

/**
 * Whether this browser can *encode* the format, not just read it. A canvas
 * hands back a PNG when it doesn't know the type you asked for, so the only
 * honest test is asking for one pixel and checking what comes back.
 */
export async function canEncode(mime: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime));
  return blob?.type === mime;
}
