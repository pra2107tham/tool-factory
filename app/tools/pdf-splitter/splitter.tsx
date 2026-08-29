"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { formatRanges, parseRanges } from "./ranges";

type Thumb = { index: number; url: string };

// pdf.js v6 is ESM-only and touches the DOM at import time, so it can't be in
// the module graph when this page is prerendered. One lazy import, cached.
let pdfjs: typeof import("pdfjs-dist") | null = null;
async function loadPdfjs() {
  if (!pdfjs) {
    const lib = await import("pdfjs-dist");
    lib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    pdfjs = lib;
  }
  return pdfjs;
}

export function Splitter() {
  const [name, setName] = useState("");
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [rangeText, setRangeText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const resultUrl = useRef<string | null>(null);
  const thumbUrls = useRef<string[]>([]);
  // Bumped on every new drop so a slow render loop can't paint thumbnails
  // belonging to a file the user already replaced.
  const loadId = useRef(0);

  const revokeThumbs = () => {
    thumbUrls.current.forEach(URL.revokeObjectURL);
    thumbUrls.current = [];
  };

  useEffect(
    () => () => {
      revokeThumbs();
      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    },
    []
  );

  const open = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (!(file.type === "application/pdf" || /\.pdf$/i.test(file.name))) {
      setError("That wasn't a PDF. This tool only splits PDF files.");
      return;
    }

    const run = ++loadId.current;
    setError(null);
    setBusy(true);
    setStatus("Reading your PDF…");
    revokeThumbs();
    setThumbs([]);
    setSelected(new Set());
    setRangeText("");
    setName(file.name);
    fileRef.current = file;

    try {
      const lib = await loadPdfjs();
      // pdf.js transfers (and detaches) the buffer it's given, so extraction
      // later re-reads the File rather than sharing this one.
      const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
        .promise;
      if (run !== loadId.current) return;

      setPageCount(doc.numPages);
      setBusy(false);
      setStatus(`${doc.numPages} page${doc.numPages === 1 ? "" : "s"} ready.`);

      // Render sequentially and append as each finishes: the grid fills in
      // progressively instead of blocking on a 200-page document.
      for (let n = 1; n <= doc.numPages; n++) {
        if (run !== loadId.current) return;
        const page = await doc.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(220 / base.width, 1.5) });

        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, viewport }).promise;

        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp"));
        if (run !== loadId.current) return;
        if (!blob) continue;

        const url = URL.createObjectURL(blob);
        thumbUrls.current.push(url);
        setThumbs((prev) => [...prev, { index: n - 1, url }]);
      }
    } catch (err) {
      if (run !== loadId.current) return;
      setBusy(false);
      setThumbs([]);
      setPageCount(0);
      fileRef.current = null;
      setError(
        (err as Error)?.name === "PasswordException"
          ? "This PDF is password-protected, so its pages can't be read. Remove the password in whatever app made it, then drop it in again."
          : "We couldn't read this PDF. It may be damaged, or not really a PDF."
      );
    }
  }, []);

  // Clicking a thumbnail and typing a range both write to `selected`; the text
  // box is regenerated from it unless the user is mid-keystroke in the box.
  const toggle = (index: number) => {
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelected(next);
    setRangeText(formatRanges(next));
  };

  const onRangeChange = (value: string) => {
    setRangeText(value);
    setSelected(parseRanges(value, pageCount));
  };

  const selectAll = () => {
    const all = new Set(Array.from({ length: pageCount }, (_, i) => i));
    setSelected(all);
    setRangeText(formatRanges(all));
  };

  const clear = () => {
    setSelected(new Set());
    setRangeText("");
  };

  const extract = async () => {
    const file = fileRef.current;
    if (!file) return;
    // Ascending, so the output is always in page order however it was typed.
    const pages = [...selected].sort((a, b) => a - b);

    setBusy(true);
    setError(null);
    try {
      const src = await PDFDocument.load(await file.arrayBuffer());
      const out = await PDFDocument.create();
      (await out.copyPages(src, pages)).forEach((p) => out.addPage(p));

      // .slice() copies into a plain ArrayBuffer — pdf-lib types save() as
      // Uint8Array<ArrayBufferLike>, which BlobPart won't take.
      const blob = new Blob([(await out.save()).slice()], { type: "application/pdf" });
      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
      resultUrl.current = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = resultUrl.current;
      a.download = `${file.name.replace(/\.pdf$/i, "")}-pages.pdf`;
      a.click();
      setStatus(`Saved ${pages.length} page${pages.length === 1 ? "" : "s"}.`);
    } catch {
      setError("Something went wrong while building the new PDF. Try dropping the file in again.");
    } finally {
      setBusy(false);
    }
  };

  const count = selected.size;

  return (
    <div>
      {pageCount === 0 ? (
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
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
            dragging
              ? "border-[#2E6FD9] bg-[#2E6FD9]/5"
              : "border-[#C7D2E0] bg-white dark:border-white/15 dark:bg-white/5"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => {
              open(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <p className="font-display text-xl text-foreground sm:text-2xl">
            {busy ? "Reading your PDF…" : "Drop a PDF here"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Every page appears as a thumbnail. Pick the ones you want and download them as a
            new PDF — the file never leaves your device.
          </p>
          <Button
            size="lg"
            className="mt-6 bg-[#2E6FD9] text-white hover:bg-[#2559AE]"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            Choose a PDF
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{name}</p>
              <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                {pageCount} page{pageCount === 1 ? "" : "s"}
                {thumbs.length < pageCount ? ` · rendering ${thumbs.length}…` : ""}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                loadId.current++;
                revokeThumbs();
                setThumbs([]);
                setPageCount(0);
                setSelected(new Set());
                setRangeText("");
                setName("");
                fileRef.current = null;
                setError(null);
              }}
            >
              Use a different PDF
            </Button>
          </div>

          <div className="mt-6 rounded-xl border border-[#C7D2E0] bg-[#E8EDF4] p-4 dark:border-white/10 dark:bg-white/5">
            <label
              htmlFor="pages"
              className="font-mono text-xs uppercase tracking-widest text-[#5A6B80] dark:text-muted-foreground"
            >
              Pages to keep
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                id="pages"
                type="text"
                inputMode="numeric"
                value={rangeText}
                onChange={(e) => onRangeChange(e.target.value)}
                placeholder="1-3, 7, 12-15"
                className="min-w-0 flex-1 rounded-lg border border-[#C7D2E0] bg-white px-3 py-2 font-mono text-sm tabular-nums text-foreground placeholder:text-[#7A8CA3] focus-visible:border-[#2E6FD9] focus-visible:ring-2 focus-visible:ring-[#2E6FD9]/40 focus-visible:outline-none dark:border-white/15 dark:bg-white/10"
              />
              <Button variant="outline" onClick={selectAll}>
                All
              </Button>
              <Button variant="outline" onClick={clear} disabled={count === 0}>
                None
              </Button>
            </div>
            <p className="mt-2 text-xs text-[#5A6B80] dark:text-muted-foreground">
              Type page numbers and ranges, or tap the pages below — the two stay in sync.
            </p>
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {thumbs.map((thumb) => {
              const on = selected.has(thumb.index);
              return (
                <li key={thumb.index}>
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={`Page ${thumb.index + 1}${on ? ", selected" : ""}`}
                    onClick={() => toggle(thumb.index)}
                    className={`group relative block w-full overflow-hidden rounded-lg border-2 bg-white transition-colors focus-visible:ring-2 focus-visible:ring-[#2E6FD9] focus-visible:ring-offset-2 focus-visible:outline-none ${
                      on
                        ? "border-[#2E6FD9] ring-2 ring-[#2E6FD9]/25"
                        : "border-[#C7D2E0] hover:border-[#7A8CA3] dark:border-white/15"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob URL from a canvas, no remote asset for next/image to optimise */}
                    <img src={thumb.url} alt="" className="block h-auto w-full" />
                    <span
                      className={`absolute left-2 top-2 rounded px-1.5 py-0.5 font-mono text-xs tabular-nums ${
                        on ? "bg-[#2E6FD9] text-white" : "bg-[#0F1B2D]/70 text-white"
                      }`}
                    >
                      {thumb.index + 1}
                    </span>
                    {on && (
                      <span
                        aria-hidden="true"
                        className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#2E6FD9] text-white motion-safe:transition-opacity"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12">
                          <path
                            d="M2 6.5L4.5 9L10 3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="sticky bottom-0 z-10 mt-6 flex flex-col gap-3 border-t border-[#C7D2E0] bg-background/95 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <p className="text-sm tabular-nums text-muted-foreground">
              {count === 0
                ? "No pages picked yet."
                : `${count} of ${pageCount} page${pageCount === 1 ? "" : "s"} selected.`}
            </p>
            <Button
              size="lg"
              disabled={busy || count === 0}
              onClick={extract}
              className="w-full bg-[#16A34A] text-white hover:bg-[#128239] sm:w-auto"
            >
              {busy ? "Working…" : `Download ${count || ""} page${count === 1 ? "" : "s"}`}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-foreground"
        >
          {error}
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {status}
      </p>
    </div>
  );
}
