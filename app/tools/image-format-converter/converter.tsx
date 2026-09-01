"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  canEncode,
  FORMATS,
  formatBytes,
  outputName,
  sizeDelta,
  type Fmt,
} from "./format";

// The transparency checkerboard, drawn in CSS — it's the one motif that says
// "image file" before you've read a word.
const CHECKER = {
  backgroundColor: "#E9EEF4",
  backgroundImage:
    "conic-gradient(#C9D4E0 25%, transparent 0 50%, #C9D4E0 0 75%, transparent 0)",
  backgroundSize: "16px 16px",
};

type Source = {
  id: number;
  name: string;
  size: number;
  bitmap: ImageBitmap;
  previewUrl: string;
};

type Result = { blob: Blob; url: string } | { error: string };

async function encode(bitmap: ImageBitmap, mime: string, quality: number) {
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  // JPEG has no alpha channel; without this, transparent pixels come out black.
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, quality)
  );
  // A canvas quietly returns PNG for a format it can't write — never pass that off.
  if (!blob || blob.type !== mime) return null;
  return blob;
}

let nextId = 1;

export function Converter() {
  const [sources, setSources] = useState<Source[]>([]);
  const [results, setResults] = useState<Record<number, Result>>({});
  const [target, setTarget] = useState<Fmt>(FORMATS[2]); // WebP — the common ask
  const [quality, setQuality] = useState(0.82);
  const [supported, setSupported] = useState<Record<string, boolean> | null>(null);
  const [working, setWorking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);

  const track = (url: string) => {
    urls.current.push(url);
    return url;
  };

  useEffect(() => () => urls.current.forEach(URL.revokeObjectURL), []);

  // Ask the browser what it can actually write, once, on load.
  useEffect(() => {
    let live = true;
    Promise.all(FORMATS.map((f) => canEncode(f.mime))).then((flags) => {
      if (!live) return;
      const map = Object.fromEntries(FORMATS.map((f, i) => [f.mime, flags[i]]));
      setSupported(map);
      setTarget((current) => (map[current.mime] ? current : FORMATS[0]));
    });
    return () => {
      live = false;
    };
  }, []);

  // Re-encode everything whenever the target or quality moves. The short delay
  // keeps a dragged slider from queueing an encode per pixel.
  useEffect(() => {
    if (!sources.length) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setWorking(true);
      // Drop the previous round first — a stale WebP blob must never be handed
      // over with an .avif name because the target changed mid-encode.
      setResults({});
      for (const source of sources) {
        const blob = await encode(source.bitmap, target.mime, quality);
        if (cancelled) return;
        setResults((prev) => ({
          ...prev,
          [source.id]: blob
            ? { blob, url: track(URL.createObjectURL(blob)) }
            : { error: `This browser can't write ${target.label} files.` },
        }));
      }
      if (!cancelled) setWorking(false);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sources, target, quality]);

  const add = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const decoded: Source[] = [];
    const rejected: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const bitmap = await createImageBitmap(file);
        decoded.push({
          id: nextId++,
          name: file.name,
          size: file.size,
          bitmap,
          previewUrl: URL.createObjectURL(file),
        });
      } catch {
        rejected.push(file.name);
      }
    }

    decoded.forEach((source) => urls.current.push(source.previewUrl));
    if (decoded.length) setSources((prev) => [...prev, ...decoded]);
    if (rejected.length) {
      setError(
        `Couldn't read ${rejected.join(", ")}. This tool handles PNG, JPG, WebP, AVIF and GIF — not RAW, HEIC or SVG.`
      );
    }
  }, []);

  const remove = (id: number) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    setResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const save = (source: Source, result: Result) => {
    if ("error" in result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = outputName(source.name, target.ext);
    a.click();
  };

  const saveAll = async () => {
    for (const source of sources) {
      const result = results[source.id];
      if (!result || "error" in result) continue;
      save(source, result);
      // Browsers drop downloads fired in the same tick — space them out.
      await new Promise((r) => setTimeout(r, 350));
    }
  };

  const ready = sources.filter((s) => {
    const r = results[s.id];
    return r && !("error" in r);
  }).length;

  const unsupported = supported
    ? FORMATS.filter((f) => !supported[f.mime]).map((f) => f.label)
    : [];

  return (
    <div>
      {/* Drop zone. Stays put once files are in, so a second batch is one drop away. */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed text-center transition-colors ${
          sources.length ? "p-6" : "p-8 sm:p-14"
        } ${
          dragging
            ? "border-[#D6246E] bg-[#D6246E]/8"
            : "border-[#C9D4E0] dark:border-white/15"
        }`}
        style={dragging ? undefined : CHECKER}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
          multiple
          className="sr-only"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
        <p
          className={`font-display text-[#16202B] ${
            sources.length ? "text-base" : "text-xl sm:text-2xl"
          }`}
        >
          {sources.length ? "Drop more images here" : "Drop your images here"}
        </p>
        {!sources.length && (
          <p className="mx-auto mt-2 max-w-sm text-sm text-[#4C5A69]">
            PNG, JPG, WebP, AVIF or GIF. As many at once as you like — they&rsquo;re
            converted on your device and never uploaded.
          </p>
        )}
        <Button
          size={sources.length ? "default" : "lg"}
          className="mt-4 bg-[#D6246E] text-white hover:bg-[#B31A5A]"
          onClick={() => inputRef.current?.click()}
        >
          Choose images
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-foreground"
        >
          {error}
        </div>
      )}

      {sources.length > 0 && (
        <>
          {/* Format chips — the signature moment. */}
          <div className="mt-6 rounded-2xl border border-[#C9D4E0] bg-white p-4 dark:border-white/10 dark:bg-white/5 sm:p-5">
            <p className="font-mono text-xs tracking-widest text-[#4C5A69] uppercase dark:text-muted-foreground">
              Convert to
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {FORMATS.map((fmt) => {
                const ok = supported?.[fmt.mime] ?? true;
                const on = target.mime === fmt.mime;
                return (
                  <button
                    key={fmt.mime}
                    type="button"
                    disabled={!ok}
                    aria-pressed={on}
                    onClick={() => setTarget(fmt)}
                    className={`rounded-lg border-2 px-4 py-2 font-mono text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#D6246E] focus-visible:ring-offset-2 focus-visible:outline-none ${
                      on
                        ? "border-[#D6246E] bg-[#D6246E] text-white"
                        : ok
                          ? "border-[#C9D4E0] text-[#16202B] hover:border-[#D6246E] dark:border-white/20 dark:text-foreground"
                          : "cursor-not-allowed border-[#DDE3EA] text-[#9AA7B4] line-through dark:border-white/10"
                    }`}
                    style={on || !ok ? undefined : CHECKER}
                  >
                    {fmt.label}
                  </button>
                );
              })}
            </div>

            {unsupported.length > 0 && (
              <p className="mt-3 text-xs text-[#4C5A69] dark:text-muted-foreground">
                Your browser can open {unsupported.join(" and ")} images but can&rsquo;t
                create them, so {unsupported.length > 1 ? "those options are" : "that option is"}{" "}
                off. Chrome or Edge on a desktop can write AVIF.
              </p>
            )}

            {target.lossy && (
              <div className="mt-5">
                <label
                  htmlFor="quality"
                  className="flex items-center justify-between text-sm text-[#16202B] dark:text-foreground"
                >
                  <span>Quality</span>
                  <span className="font-mono text-[#D6246E]">
                    {Math.round(quality * 100)}
                  </span>
                </label>
                <input
                  id="quality"
                  type="range"
                  min={30}
                  max={100}
                  step={1}
                  value={Math.round(quality * 100)}
                  onChange={(e) => setQuality(Number(e.target.value) / 100)}
                  className="mt-2 w-full accent-[#D6246E]"
                />
                <p className="mt-1 text-xs text-[#4C5A69] dark:text-muted-foreground">
                  Lower means a smaller file with softer detail. Around 80 is
                  hard to tell from the original.
                </p>
              </div>
            )}
          </div>

          <ul className="mt-4 space-y-3">
            {sources.map((source) => {
              const result = results[source.id];
              return (
                <li
                  key={source.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-[#C9D4E0] bg-white p-3 dark:border-white/10 dark:bg-white/5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- object URL, nothing for next/image to optimise */}
                  <img
                    src={source.previewUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    style={CHECKER}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {source.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {source.bitmap.width}×{source.bitmap.height} ·{" "}
                      {formatBytes(source.size)}
                      {result && !("error" in result) && (
                        <>
                          {" → "}
                          <span className="font-medium whitespace-nowrap text-foreground">
                            {formatBytes(result.blob.size)}
                          </span>{" "}
                          <span className="whitespace-nowrap text-[#0E7C86] dark:text-[#3FB3BD]">
                            {sizeDelta(source.size, result.blob.size)}
                          </span>
                        </>
                      )}
                      {result && "error" in result && (
                        <span className="text-destructive"> · {result.error}</span>
                      )}
                      {!result && " · converting…"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!result || "error" in result}
                      onClick={() => result && save(source, result)}
                    >
                      {target.label}
                    </Button>
                    <button
                      type="button"
                      onClick={() => remove(source.id)}
                      aria-label={`Remove ${source.name}`}
                      className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-[#D6246E] focus-visible:outline-none"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {working
                ? "Converting…"
                : `${ready} of ${sources.length} ready as ${target.label}.`}
            </p>
            <Button
              size="lg"
              disabled={ready === 0}
              onClick={saveAll}
              className="w-full bg-[#D6246E] text-white hover:bg-[#B31A5A] sm:w-auto"
            >
              {sources.length > 1 ? `Download all ${target.label}` : `Download ${target.label}`}
            </Button>
          </div>
          {sources.length > 1 && (
            <p className="mt-2 text-right text-xs text-muted-foreground">
              They save one after another — your browser may ask to allow multiple
              downloads.
            </p>
          )}
        </>
      )}

      <p aria-live="polite" className="sr-only">
        {working ? "Converting" : ready ? `${ready} files ready as ${target.label}` : ""}
      </p>
    </div>
  );
}
