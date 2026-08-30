"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { advance, startProgress, type Progress } from "./progress";

// Transparency checkerboard, drawn in CSS so there's no asset to load.
const CHECKER = {
  backgroundColor: "#EDEFF4",
  backgroundImage:
    "conic-gradient(#C7CBD6 25%, transparent 0 50%, #C7CBD6 0 75%, transparent 0)",
  backgroundSize: "18px 18px",
};

// Transparent first, then white — white is what marketplace and passport-photo
// listings actually ask for. The rest are one tap each; anything else is the
// native colour picker next to them.
const SWATCHES: { label: string; value: string | null }[] = [
  { label: "Transparent", value: null },
  { label: "White", value: "#FFFFFF" },
  { label: "Black", value: "#111318" },
  { label: "Studio grey", value: "#E7E9EE" },
  { label: "Passport blue", value: "#D6E4F7" },
  { label: "Warm sand", value: "#F3E6D2" },
];

export function Remover() {
  const [origUrl, setOrigUrl] = useState<string | null>(null);
  const [cutUrl, setCutUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress>(startProgress);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [bg, setBg] = useState<string | null>(null);
  // How much of the original is wiped back in, from the left edge. 0 = the
  // cutout, whole and unobstructed, which is what you want to see on landing.
  const [reveal, setReveal] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const cutBlob = useRef<Blob | null>(null);
  const urls = useRef<string[]>([]);
  // Bumped per drop so a slow run can't paint a cutout of a replaced photo.
  const runId = useRef(0);

  const track = (url: string) => {
    urls.current.push(url);
    return url;
  };

  useEffect(() => () => urls.current.forEach(URL.revokeObjectURL), []);

  const open = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That wasn't an image. Drop a JPG, PNG, or WebP photo instead.");
      return;
    }

    const run = ++runId.current;
    setError(null);
    setBusy(true);
    setProgress(startProgress);
    setCutUrl(null);
    setReveal(0);
    setBg(null);
    setName(file.name);
    setOrigUrl(track(URL.createObjectURL(file)));

    try {
      // ~40MB of model and WASM, and it touches the DOM at import time — so it
      // stays out of the module graph until someone actually picks a photo.
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        output: { format: "image/png" },
        progress: (key, loaded, total) => {
          if (run !== runId.current) return;
          setProgress((p) => advance(p, key, loaded, total));
        },
      });
      if (run !== runId.current) return;

      cutBlob.current = blob;
      setCutUrl(track(URL.createObjectURL(blob)));
      setBusy(false);
    } catch (err) {
      if (run !== runId.current) return;
      setBusy(false);
      setOrigUrl(null);
      console.error(err);
      setError(
        "The cutout model couldn't load or finish. It's a big download — check your connection and try the photo again."
      );
    }
  }, []);

  const download = async () => {
    const blob = cutBlob.current;
    if (!blob) return;
    const base = name.replace(/\.[^.]+$/, "") || "cutout";

    let out = blob;
    if (bg) {
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      const filled = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (!filled) {
        setError("The browser couldn't build that PNG. Try the transparent version instead.");
        return;
      }
      out = filled;
    }

    const url = track(URL.createObjectURL(out));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}-${bg ? "background" : "no-background"}.png`;
    a.click();
  };

  const reset = () => {
    runId.current++;
    setOrigUrl(null);
    setCutUrl(null);
    setName("");
    setBusy(false);
    setError(null);
    cutBlob.current = null;
  };

  // Nothing picked yet — the drop zone is the whole tool.
  if (!origUrl) {
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
            open(e.dataTransfer.files[0]);
          }}
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors sm:p-14 ${
            dragging
              ? "border-[#5B3DF5] bg-[#5B3DF5]/8"
              : "border-[#C7CBD6] bg-white dark:border-white/15 dark:bg-white/5"
          }`}
          style={dragging ? undefined : CHECKER}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              open(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <p className="font-display text-xl text-[#2A1E5C] sm:text-2xl dark:text-foreground">
            Drop a photo here
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[#4A4560] dark:text-muted-foreground">
            The background comes off by itself — no button to press. The photo stays on your
            phone or laptop; nothing is uploaded.
          </p>
          <Button
            size="lg"
            className="mt-6 bg-[#5B3DF5] text-white hover:bg-[#4A2FD6]"
            onClick={() => inputRef.current?.click()}
          >
            Choose a photo
          </Button>
          <p className="mt-4 text-xs text-[#4A4560] dark:text-muted-foreground">
            First photo downloads a 40MB model — after that it&rsquo;s instant and works offline.
          </p>
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{name}</p>
        <Button variant="outline" onClick={reset}>
          Use a different photo
        </Button>
      </div>

      {/* The stage: dark frame so a transparent edge is judged against contrast. */}
      <div
        className="relative mt-4 overflow-hidden rounded-2xl bg-[#2A1E5C] p-2 sm:p-3"
        style={{ colorScheme: "light" }}
      >
        <div
          className="relative select-none overflow-hidden rounded-xl"
          style={bg ? { backgroundColor: bg } : CHECKER}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL, nothing for next/image to optimise */}
          <img
            src={cutUrl ?? origUrl}
            alt={cutUrl ? "Your photo with the background removed" : "Your photo"}
            className={`block h-auto max-h-[60vh] w-full object-contain ${
              cutUrl ? "" : "opacity-40 blur-sm"
            }`}
          />

          {cutUrl && (
            <>
              {/* The original, clipped to the left of the handle. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- same blob URL reason */}
              <img
                src={origUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 block h-full w-full object-contain"
                style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }}
              />

              <input
                type="range"
                min={0}
                max={100}
                value={reveal}
                aria-label="Wipe back to the original photo"
                onChange={(e) => setReveal(Number(e.target.value))}
                className="peer absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 z-0 w-0.5 bg-[#F4B740] peer-focus-visible:w-1 peer-focus-visible:[&>span]:ring-2 peer-focus-visible:[&>span]:ring-white"
                style={{ left: `${reveal}%` }}
              >
                <span className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#F4B740] text-[#2A1E5C] shadow-md">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M7 4L3.5 9L7 14M11 4l3.5 5L11 14"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </>
          )}

          {busy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2A1E5C]/80 px-6 text-center text-white">
              <p className="font-display text-lg">{progress.text}</p>
              <div className="mt-4 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-[#F4B740] motion-safe:transition-[width] motion-safe:duration-300"
                  style={{ width: `${progress.computing ? 100 : progress.percent}%` }}
                />
              </div>
              <p className="mt-3 max-w-xs text-xs text-white/75">
                {progress.computing
                  ? "Nearly there — this part runs on your device."
                  : "One-time download. Your browser caches it, so the next photo is quick."}
              </p>
            </div>
          )}
        </div>
      </div>

      {cutUrl && (
        <>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Drag the handle to wipe the original back in and check the edges.
          </p>

          <div className="mt-6 rounded-xl border border-[#D7D3E8] bg-[#F1EFFB] p-4 dark:border-white/10 dark:bg-white/5">
            <p className="font-mono text-xs tracking-widest text-[#4A4560] uppercase dark:text-muted-foreground">
              Background
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {SWATCHES.map((swatch) => {
                const on = bg === swatch.value;
                return (
                  <button
                    key={swatch.label}
                    type="button"
                    aria-pressed={on}
                    title={swatch.label}
                    onClick={() => setBg(swatch.value)}
                    className={`h-9 w-9 rounded-full border-2 focus-visible:ring-2 focus-visible:ring-[#5B3DF5] focus-visible:ring-offset-2 focus-visible:outline-none ${
                      on ? "border-[#5B3DF5] ring-2 ring-[#5B3DF5]/30" : "border-[#C7CBD6]"
                    }`}
                    style={swatch.value ? { backgroundColor: swatch.value } : CHECKER}
                  >
                    <span className="sr-only">{swatch.label}</span>
                  </button>
                );
              })}
              <label className="flex h-9 cursor-pointer items-center gap-2 rounded-full border-2 border-[#C7CBD6] px-3 text-xs text-[#4A4560] focus-within:ring-2 focus-within:ring-[#5B3DF5] dark:text-muted-foreground">
                <input
                  type="color"
                  value={bg ?? "#FFFFFF"}
                  onChange={(e) => setBg(e.target.value)}
                  className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                />
                Any colour
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {bg ? `PNG on ${bg.toUpperCase()}.` : "PNG with a transparent background."}
            </p>
            <Button
              size="lg"
              onClick={download}
              className="w-full bg-[#5B3DF5] text-white hover:bg-[#4A2FD6] sm:w-auto"
            >
              Download PNG
            </Button>
          </div>
        </>
      )}

      {error && <ErrorNote>{error}</ErrorNote>}

      <p aria-live="polite" className="sr-only">
        {busy ? progress.text : cutUrl ? "Background removed. Ready to download." : ""}
      </p>
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-foreground"
    >
      {children}
    </div>
  );
}
