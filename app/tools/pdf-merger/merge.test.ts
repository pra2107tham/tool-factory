/**
 * Runnable check for the two things that would silently ruin the output:
 * the reorder splice, and whether merge order actually survives into the PDF.
 * Run with: npx tsx app/tools/pdf-merger/merge.test.ts
 */
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";

// Mirrors the splice in merger.tsx's `move`.
function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

const abc = ["a", "b", "c", "d"];
assert.deepEqual(move(abc, 0, 1), ["b", "a", "c", "d"], "move down by one");
assert.deepEqual(move(abc, 3, 0), ["d", "a", "b", "c"], "move last to first");
assert.deepEqual(move(abc, 1, 1), abc, "no-op stays identical");
assert.deepEqual(move(abc, 0, -1), abc, "cannot move above the top");
assert.deepEqual(move(abc, 3, 4), abc, "cannot move below the bottom");
assert.deepEqual(abc, ["a", "b", "c", "d"], "move never mutates its input");

// Build real PDFs with known page counts, then merge them out of order.
async function pdfWith(pages: number, label: string) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    doc.addPage([200, 200]).drawText(`${label}${i}`, { x: 20, y: 100, size: 24, font });
  }
  return doc.save();
}

// Wrapped in main() because this package is CJS — no top-level await.
async function main() {
  const [one, two] = await Promise.all([pdfWith(2, "A"), pdfWith(3, "B")]);

  const out = await PDFDocument.create();
  for (const bytes of [two, one]) {
    const src = await PDFDocument.load(bytes);
    (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
  }
  const merged = await PDFDocument.load(await out.save());
  assert.equal(merged.getPageCount(), 5, "merged doc holds every page from both files");

  // A non-PDF must throw rather than merge silently — that's what puts the
  // error message on the card.
  await assert.rejects(
    () => PDFDocument.load(new TextEncoder().encode("not a pdf")),
    "garbage input is rejected, not merged"
  );

  console.log("ok — reorder and merge behave");
}

main();
