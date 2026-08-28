"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";

type Doc = {
  id: string;
  name: string;
  size: number;
  file: File;
  pages: number | null; // null when the file wouldn't parse
  error: string | null;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 2 : 1)} MB`;
}

// Encrypted files throw from PDFDocument.load — pdf-lib 1.x has no
// ignoreEncryption escape hatch, which suits us: a locked file gets its own
// message on its own card and the rest of the merge carries on without it.
function readErrorFor(err: unknown) {
  return String(err).toLowerCase().includes("encrypt")
    ? "Password-protected, so it can't be merged. Remove the password and add it again."
    : "We couldn't read this PDF. It may be damaged or not really a PDF.";
}

async function inspect(file: File): Promise<Doc> {
  const base = {
    id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    file,
  };
  try {
    const doc = await PDFDocument.load(await file.arrayBuffer());
    return { ...base, pages: doc.getPageCount(), error: null };
  } catch (err) {
    return { ...base, pages: null, error: readErrorFor(err) };
  }
}

export function Merger() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [fatal, setFatal] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    },
    []
  );

  const addFiles = useCallback(async (list: FileList | null) => {
    const picked = Array.from(list ?? []).filter(
      (f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name)
    );
    if (!picked.length) {
      setFatal("Those weren't PDFs. This tool only combines PDF files.");
      return;
    }
    setFatal(null);
    setBusy(true);
    const inspected = await Promise.all(picked.map(inspect));
    // Append, so adding more never discards what's already staged.
    setDocs((prev) => [...prev, ...inspected]);
    setStatus(`Added ${inspected.length} file${inspected.length === 1 ? "" : "s"}.`);
    setBusy(false);
  }, []);

  const move = useCallback((from: number, to: number) => {
    setDocs((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    setStatus("Removed a file.");
  }, []);

  // Pointer events, not HTML5 drag-and-drop: dragstart never fires on touch,
  // and reordering by touch is half the point of this tool. One code path
  // covers mouse, pen and finger.
  const dragState = useRef<{ id: string; startY: number; index: number } | null>(null);
  const [heldId, setHeldId] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());

  const onPointerDown = (e: React.PointerEvent, id: string, index: number) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { id, startY: e.clientY, index };
    setHeldId(id);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragState.current;
    if (!drag) return;
    const from = docs.findIndex((d) => d.id === drag.id);
    if (from === -1) return;

    // Swap as soon as the pointer passes the midpoint of the neighbour it's
    // heading towards — cheap, and it feels right without any measurement math.
    const dir = e.clientY > drag.startY ? 1 : -1;
    const neighbour = rowRefs.current.get(docs[from + dir]?.id ?? "");
    if (!neighbour) return;
    const box = neighbour.getBoundingClientRect();
    const midpoint = box.top + box.height / 2;
    if ((dir === 1 && e.clientY > midpoint) || (dir === -1 && e.clientY < midpoint)) {
      move(from, from + dir);
      drag.startY = e.clientY;
    }
  };

  const endDrag = () => {
    const drag = dragState.current;
    if (drag) {
      const to = docs.findIndex((d) => d.id === drag.id);
      if (to !== -1 && to !== drag.index) {
        setStatus(`Moved to position ${to + 1} of ${docs.length}.`);
      }
    }
    dragState.current = null;
    setHeldId(null);
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const dir = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (!dir) return;
    const to = index + dir;
    if (to < 0 || to >= docs.length) return;
    e.preventDefault();
    move(index, to);
    setStatus(`Moved to position ${to + 1} of ${docs.length}.`);
    // Keep focus with the card the user is moving, not the position it left.
    const id = docs[index].id;
    requestAnimationFrame(() => rowRefs.current.get(id)?.querySelector("button")?.focus());
  };

  const mergeable = docs.filter((d) => d.pages !== null);
  const totalPages = mergeable.reduce((n, d) => n + (d.pages ?? 0), 0);

  const merge = async () => {
    setBusy(true);
    setFatal(null);
    try {
      const out = await PDFDocument.create();
      for (const doc of mergeable) {
        const src = await PDFDocument.load(await doc.file.arrayBuffer());
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      // .slice() copies into a plain ArrayBuffer — pdf-lib types save() as
      // Uint8Array<ArrayBufferLike>, which BlobPart won't take.
      const blob = new Blob([(await out.save()).slice()], { type: "application/pdf" });

      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
      resultUrl.current = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = resultUrl.current;
      a.download = "merged.pdf";
      a.click();
      setStatus(`Merged ${mergeable.length} files into merged.pdf.`);
    } catch {
      setFatal("Something went wrong while merging. Try removing the last file you added.");
    } finally {
      setBusy(false);
    }
  };

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
          addFiles(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
          dragging ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="font-display text-xl text-foreground sm:text-2xl">
          {docs.length ? "Add more PDFs" : "Drop your PDFs here"}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Pick as many as you like. They never leave your phone or laptop — the whole
          merge happens right here in the browser.
        </p>
        <Button size="lg" className="mt-6" onClick={() => inputRef.current?.click()}>
          Choose PDFs
        </Button>
      </div>

      {fatal && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-foreground"
        >
          {fatal}
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {status}
      </p>

      {docs.length > 0 && (
        <div className="mt-8">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Merge order — drag a card, or focus one and use the arrow keys
          </p>

          <ul className="mt-4 space-y-3">
            {docs.map((doc, i) => (
              <li
                key={doc.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(doc.id, el);
                  else rowRefs.current.delete(doc.id);
                }}
                className={`flex items-center gap-3 rounded-xl border bg-card p-3 sm:gap-4 sm:p-4 ${
                  heldId === doc.id
                    ? "border-primary shadow-lg"
                    : doc.error
                      ? "border-destructive/40"
                      : "border-border"
                }`}
              >
                <span className="w-6 shrink-0 text-center font-mono text-sm text-muted-foreground">
                  {i + 1}
                </span>

                <button
                  type="button"
                  aria-label={`Reorder ${doc.name}. Currently position ${i + 1} of ${docs.length}. Use arrow keys to move.`}
                  onPointerDown={(e) => onPointerDown(e, doc.id, i)}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className="shrink-0 cursor-grab touch-none rounded-md px-2 py-2 text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
                >
                  <svg width="14" height="18" viewBox="0 0 14 18" aria-hidden="true">
                    <g fill="currentColor">
                      {[4, 9, 14].map((y) =>
                        [4, 10].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />)
                      )}
                    </g>
                  </svg>
                </button>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {doc.error ? (
                      <span className="text-destructive">{doc.error}</span>
                    ) : (
                      `${doc.pages} page${doc.pages === 1 ? "" : "s"} · ${formatBytes(doc.size)}`
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => remove(doc.id)}
                  aria-label={`Remove ${doc.name}`}
                  className="shrink-0 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {mergeable.length > 0
                ? `${totalPages} page${totalPages === 1 ? "" : "s"} from ${mergeable.length} file${
                    mergeable.length === 1 ? "" : "s"
                  }`
                : "No readable PDFs staged yet."}
            </p>
            <Button
              size="lg"
              disabled={busy || mergeable.length < 2}
              onClick={merge}
              className="w-full sm:w-auto"
            >
              {busy ? "Merging…" : "Merge PDFs"}
            </Button>
          </div>
          {mergeable.length === 1 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Add one more PDF and the merge button wakes up.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
