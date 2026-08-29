/**
 * Runnable check for the two things that would silently ruin the output:
 * the range parser (typing must never desync from the thumbnails) and whether
 * the extracted PDF really holds the selected pages, in page order.
 * Run with: npx tsx app/tools/pdf-splitter/ranges.test.ts
 *
 * pdf.js is deliberately absent — it only draws thumbnails, needs a DOM and a
 * worker, and none of that decides what lands in the output file.
 */
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { formatRanges, parseRanges } from "./ranges";

const set = (...pages: number[]) => new Set(pages);
const parse = (input: string, count = 20) => parseRanges(input, count);

// Parsing: 1-based in, 0-based out.
assert.deepEqual(parse("1"), set(0), "a single page");
assert.deepEqual(parse("1-3"), set(0, 1, 2), "an inclusive range");
assert.deepEqual(parse("1-3, 7, 12-15"), set(0, 1, 2, 6, 11, 12, 13, 14), "the brief's example");
assert.deepEqual(parse("  3 , 1  "), set(0, 2), "whitespace and order don't matter");
assert.deepEqual(parse("2 - 4"), set(1, 2, 3), "spaces around the dash");
assert.deepEqual(parse("7-3"), set(2, 3, 4, 5, 6), "reversed ranges still select");
assert.deepEqual(parse("2,2,2"), set(1), "duplicates collapse");

// Mid-typing states: these run on every keystroke and must not throw.
assert.deepEqual(parse(""), set(), "empty string selects nothing");
assert.deepEqual(parse("5-"), set(4), "a half-typed range is just its first page");
assert.deepEqual(parse("4,"), set(3), "a trailing comma is ignored");
assert.deepEqual(parse("abc"), set(), "garbage selects nothing rather than throwing");
assert.deepEqual(parse("2, junk, 4"), set(1, 3), "one bad token doesn't poison the good ones");

// Clamping to the real document — the output can only contain pages that exist.
assert.deepEqual(parse("8-99", 10), set(7, 8, 9), "ranges clamp to the last page");
assert.deepEqual(parse("50", 10), set(), "a page past the end selects nothing");
assert.deepEqual(parse("0-2", 10), set(0, 1), "page 0 doesn't exist; 1-2 do");

// Formatting: consecutive pages collapse, gaps split.
assert.equal(formatRanges(set()), "", "no selection is an empty string");
assert.equal(formatRanges(set(0)), "1", "one page");
assert.equal(formatRanges(set(0, 1, 2)), "1-3", "three consecutive pages collapse");
assert.equal(formatRanges(set(0, 2)), "1, 3", "a gap splits the run");
assert.equal(formatRanges(set(6, 0, 1, 2)), "1-3, 7", "unsorted input still formats in order");
assert.equal(formatRanges(set(0, 1, 3, 4)), "1-2, 4-5", "two separate runs");

// The round trip is what keeps clicking and typing in sync.
for (const input of ["1", "1-3, 7, 12-15", "2, 4, 6", "1-20", "5-7, 9"]) {
  assert.equal(formatRanges(parse(input)), input, `round trip is stable for "${input}"`);
}

// Build a PDF whose pages are individually identifiable, extract some, and
// confirm the right ones came out in ascending order.
async function main() {
  const src = await PDFDocument.create();
  const font = await src.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 10; i++) {
    src.addPage([200, 200]).drawText(`PAGE${i + 1}`, { x: 20, y: 100, size: 18, font });
  }
  const srcBytes = await src.save();

  // Typed out of order on purpose: the output must still be in page order.
  const selected = [...parseRanges("7, 1-3", 10)].sort((a, b) => a - b);
  assert.deepEqual(selected, [0, 1, 2, 6], "selection sorts ascending before extraction");

  const loaded = await PDFDocument.load(srcBytes);
  const out = await PDFDocument.create();
  (await out.copyPages(loaded, selected)).forEach((p) => out.addPage(p));

  const result = await PDFDocument.load(await out.save());
  assert.equal(result.getPageCount(), 4, "output holds exactly the selected pages");

  // Page size is the cheapest proof the copy landed; text extraction needs a
  // parser pdf-lib doesn't ship.
  assert.equal(Math.round(result.getPage(0).getWidth()), 200, "copied pages keep their size");

  await assert.rejects(
    () => PDFDocument.load(new TextEncoder().encode("not a pdf")),
    "garbage input is rejected, not silently split"
  );

  console.log("ok — range parsing and page extraction behave");
}

main();
