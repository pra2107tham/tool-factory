"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

// Three fixed presets — this is the whole interface, by design. Each drops
// quality *and* caps the long edge, because quality alone won't get a 12MP
// phone photo under an upload limit.
const PRESETS = [
  { key: "light", label: "Light", note: "Full size, gentler squeeze", maxEdge: Infinity, quality: 0.8 },
  { key: "balanced", label: "Balanced", note: "The one most people want", maxEdge: 2000, quality: 0.7 },
  { key: "smallest", label: "Smallest", note: "For strict upload limits", maxEdge: 1280, quality: 0.55 },
] as const;

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

type Result = {
  key: string;
  label: string;
  note: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 2 : 1)} MB`;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed"))),
      type,
      quality
    );
  });
}

function isHeic(file: File) {
  return /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

const HEIC_ERROR =
  "That looks like a HEIC file. iPhone photos save as HEIC, which browsers can't open. In Settings → Camera → Formats, pick Most Compatible, or take a screenshot of the photo and drop that in instead.";

export function Compressor() {
  const [results, setResults] = useState<Result[]>([]);
  const [original, setOriginal] = useState<{ name: string; size: number; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Object URLs outlive the render that made them — release on replace/unmount.
  const urlsRef = useRef<string[]>([]);
  const trackUrl = (url: string) => {
    urlsRef.current.push(url);
    return url;
  };
  const releaseUrls = useCallback(() => {
    urlsRef.current.forEach(URL.revokeObjectURL);
    urlsRef.current = [];
  }, []);
  useEffect(() => releaseUrls, [releaseUrls]);

  const handleFile = useCallback(
    async (file: File) => {
      releaseUrls();
      setResults([]);
      setOriginal(null);
      setError(null);

      if (isHeic(file)) {
        setError(HEIC_ERROR);
        return;
      }
      if (!ACCEPTED.includes(file.type)) {
        setError(
          `This tool reads JPEG, PNG and WebP images. ${
            file.type ? `That file is a ${file.type}.` : "That file isn't an image we can read."
          }`
        );
        return;
      }

      setBusy(true);
      try {
        const bitmap = await createImageBitmap(file);
        // PNG re-encoded as PNG usually gets *bigger*, so everything lands as
        // JPEG unless the source was WebP, which already beats it.
        const outType = file.type === "image/webp" ? "image/webp" : "image/jpeg";
        const ext = outType === "image/webp" ? "webp" : "jpg";
        const stem = file.name.replace(/\.[^.]+$/, "") || "image";

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d context");

        const next: Result[] = [];
        for (const preset of PRESETS) {
          const scale = Math.min(1, preset.maxEdge / Math.max(bitmap.width, bitmap.height));
          canvas.width = Math.round(bitmap.width * scale);
          canvas.height = Math.round(bitmap.height * scale);
          // Flatten transparency to white — a transparent PNG would otherwise
          // come out black once it's a JPEG.
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

          const blob = await toBlob(canvas, outType, preset.quality);
          next.push({
            key: `${stem}-${preset.key}.${ext}`,
            label: preset.label,
            note: preset.note,
            blob,
            url: trackUrl(URL.createObjectURL(blob)),
            width: canvas.width,
            height: canvas.height,
          });
        }
        bitmap.close();

        setOriginal({ name: file.name, size: file.size, url: trackUrl(URL.createObjectURL(file)) });
        setResults(next);
      } catch {
        setError(
          "We couldn't read that image. It may be damaged or saved in a format your browser can't open — try a JPEG, PNG or WebP."
        );
      } finally {
        setBusy(false);
      }
    },
    [releaseUrls]
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
          dragging ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <p className="font-display text-xl text-foreground sm:text-2xl">
          {busy ? "Shrinking your image…" : "Drop an image here"}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          JPEG, PNG or WebP. It never leaves your phone or laptop — all three versions are
          made right here in the browser.
        </p>
        <Button
          size="lg"
          className="mt-6"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          Choose an image
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-foreground"
        >
          {error}
        </div>
      )}

      {original && results.length > 0 && (
        <div className="mt-8">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {original.name} — {formatBytes(original.size)} to start
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {results.map((r) => {
              const saved = Math.round((1 - r.blob.size / original.size) * 100);
              return (
                <div
                  key={r.key}
                  className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.url}
                    alt={`${r.label} version, ${r.width} by ${r.height} pixels`}
                    className="aspect-4/3 w-full bg-muted object-cover"
                  />
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-lg text-foreground">{r.label}</h3>
                      <span className="font-mono text-sm text-foreground">
                        {formatBytes(r.blob.size)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.note}</p>
                    <p className="mt-3 font-mono text-xs text-muted-foreground">
                      {saved > 0 ? (
                        <span className="text-primary">{saved}% smaller</span>
                      ) : (
                        "Already about as small as it gets"
                      )}
                      {" · "}
                      {r.width}×{r.height}
                    </p>
                    <a
                      href={r.url}
                      download={r.key}
                      className={buttonVariants({
                        variant: "outline",
                        size: "lg",
                        className: "mt-4 w-full",
                      })}
                    >
                      Download {r.label.toLowerCase()}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
