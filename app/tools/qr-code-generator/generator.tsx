"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { COLOR, EXAMPLE, fileName, LEVELS, PNG_SIZES, QUIET_ZONE, type Level } from "./qr";

function save(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
}

/** `initialSvg` is the example code, rendered at build time so it's on screen in
 *  the first paint rather than a hydration later. */
export function Generator({ initialSvg }: { initialSvg: string }) {
  const [text, setText] = useState(EXAMPLE);
  const [level, setLevel] = useState<Level>("M");
  const [size, setSize] = useState(1024);
  // One outcome at a time: a code, or the reason there isn't one.
  const [out, setOut] = useState<{ svg?: string; error?: string }>({ svg: initialSvg });
  const [busy, setBusy] = useState(false);

  const trimmed = text.trim();

  // Re-render on every keystroke. One SVG serves both the preview and the SVG
  // download, so there's nothing to regenerate when you hit save.
  useEffect(() => {
    if (!trimmed) return;
    let live = true;
    QRCode.toString(trimmed, {
      type: "svg",
      errorCorrectionLevel: level,
      margin: QUIET_ZONE,
      color: COLOR,
    })
      .then((markup) => live && setOut({ svg: markup }))
      .catch(
        () =>
          live &&
          setOut({
            error: `That's more than a QR code can hold at level ${level}. Shorten the text, or drop to a lower error-correction level for more room.`,
          })
      );
    return () => {
      live = false;
    };
  }, [trimmed, level]);

  // Derived, so emptying the box clears the preview in the same paint — and the
  // last good code stays up for the microsecond the next one takes to build.
  const svg = trimmed ? (out.svg ?? null) : null;
  const error = trimmed ? (out.error ?? null) : null;

  const downloadSvg = () => {
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    save(url, fileName(trimmed, "svg"));
    // Revoke on the next tick — immediately would race the click.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadPng = async () => {
    if (!svg) return;
    setBusy(true);
    try {
      const dataUrl = await QRCode.toDataURL(trimmed, {
        errorCorrectionLevel: level,
        margin: QUIET_ZONE,
        width: size,
        color: COLOR,
      });
      save(dataUrl, fileName(trimmed, "png"));
    } catch {
      setOut((prev) => ({
        ...prev,
        error: "Couldn't build the PNG. Try a smaller size, or download the SVG instead.",
      }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,20rem)] lg:items-start">
      {/* Input first on mobile, where the keyboard is the whole story. */}
      <div className="order-1 space-y-5">
        <div>
          <label
            htmlFor="qr-text"
            className="font-mono text-xs tracking-widest text-[#5A6572] uppercase dark:text-muted-foreground"
          >
            Link or text
          </label>
          <textarea
            id="qr-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            spellCheck={false}
            placeholder="https://your-link.com — or any text at all"
            className="mt-2 w-full resize-y rounded-xl border-2 border-[#DCDFE3] bg-white p-4 font-mono text-sm break-all text-[#111418] placeholder:text-[#98A1AC] focus-visible:border-[#FF5A1F] focus-visible:ring-2 focus-visible:ring-[#FF5A1F]/30 focus-visible:outline-none dark:border-white/15 dark:bg-white/5 dark:text-foreground"
          />
        </div>

        <fieldset className="rounded-xl border border-[#DCDFE3] bg-[#F3F1EC] p-4 dark:border-white/10 dark:bg-white/5">
          <legend className="px-1 font-mono text-xs tracking-widest text-[#5A6572] uppercase dark:text-muted-foreground">
            Error correction
          </legend>
          <div className="mt-2 flex gap-2">
            {LEVELS.map((l) => {
              const on = l.id === level;
              return (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setLevel(l.id)}
                  className={`flex-1 rounded-lg border-2 py-2 font-mono text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#FF5A1F] focus-visible:ring-offset-2 focus-visible:outline-none ${
                    on
                      ? "border-[#FF5A1F] bg-[#FF5A1F] text-white"
                      : "border-[#DCDFE3] bg-white text-[#111418] hover:border-[#FF5A1F] dark:border-white/20 dark:bg-transparent dark:text-foreground"
                  }`}
                >
                  {l.id}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[#5A6572] dark:text-muted-foreground">
            Higher levels survive more damage — {level} still scans with about{" "}
            {LEVELS.find((l) => l.id === level)!.recovers} of the code scratched or
            covered — but pack the grid tighter. M suits screens and posters; pick H
            for stickers, small print, or anything that&rsquo;ll get handled.
          </p>
        </fieldset>

        <div className="rounded-xl border border-[#DCDFE3] bg-[#F3F1EC] p-4 dark:border-white/10 dark:bg-white/5">
          <p className="font-mono text-xs tracking-widest text-[#5A6572] uppercase dark:text-muted-foreground">
            PNG size
          </p>
          <div className="mt-2 flex gap-2">
            {PNG_SIZES.map((px) => {
              const on = px === size;
              return (
                <button
                  key={px}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSize(px)}
                  className={`flex-1 rounded-lg border-2 py-2 font-mono text-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#FF5A1F] focus-visible:ring-offset-2 focus-visible:outline-none ${
                    on
                      ? "border-[#FF5A1F] bg-[#FF5A1F] text-white"
                      : "border-[#DCDFE3] bg-white text-[#111418] hover:border-[#FF5A1F] dark:border-white/20 dark:bg-transparent dark:text-foreground"
                  }`}
                >
                  {px}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              disabled={!svg || busy}
              onClick={downloadPng}
              className="flex-1 bg-[#FF5A1F] text-white hover:bg-[#DB4610]"
            >
              {busy ? "Building PNG…" : `Download PNG (${size}px)`}
            </Button>
            <Button
              size="lg"
              variant="outline"
              disabled={!svg}
              onClick={downloadSvg}
              className="flex-1 border-2 border-[#111418] text-[#111418] hover:bg-[#111418] hover:text-white dark:border-white/40 dark:text-foreground"
            >
              Download SVG
            </Button>
          </div>
        </div>
      </div>

      {/* The signature moment. White card in both themes — a QR code inverted on a
          dark background is a code half the scanners in the world won't read. */}
      <div className="order-first lg:order-none lg:sticky lg:top-6">
        <div className="rounded-2xl border-2 border-[#111418] bg-white p-3 shadow-[6px_6px_0_#111418] dark:border-white/20 dark:shadow-[6px_6px_0_rgba(255,255,255,0.12)]">
          {svg ? (
            /* eslint-disable-next-line @next/next/no-img-element -- generated in-browser, nothing for next/image to fetch */
            <img
              src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
              alt={`QR code for ${trimmed.slice(0, 80)}`}
              className="aspect-square w-full"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center p-6 text-center">
              <p className="text-sm text-[#5A6572]">
                {error
                  ? "No code yet — see the note below."
                  : "Type a link or any text and your code appears here."}
              </p>
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-[#5A6572] dark:text-muted-foreground">
          Point a phone camera at it to test before you print.
        </p>
        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
