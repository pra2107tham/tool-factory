/**
 * Runnable check for the two bits of logic that can quietly hand someone a
 * wrong answer: the filename the download gets, and the size-change line they
 * decide on. Run with: npx tsx app/tools/image-format-converter/format.test.ts
 *
 * The encode path isn't tested here — it's canvas.toBlob, which needs a DOM
 * and either returns the MIME you asked for or doesn't (that's `canEncode`).
 */
import assert from "node:assert/strict";
import { formatBytes, outputName, sizeDelta } from "./format";

// The extension is swapped, not appended — "photo.png.webp" looks broken.
assert.equal(outputName("photo.png", "webp"), "photo.webp");
assert.equal(outputName("holiday.snap.2024.jpeg", "avif"), "holiday.snap.2024.avif");
assert.equal(outputName("no-extension", "png"), "no-extension.png");
assert.equal(outputName(".hidden", "png"), "image.png", "an all-extension name still gets a name");

assert.equal(sizeDelta(1000, 250), "75% smaller");
assert.equal(sizeDelta(1000, 1500), "50% bigger", "PNG targets often grow — say so plainly");
assert.equal(sizeDelta(1000, 1000), "same size");
assert.equal(sizeDelta(0, 500), "", "no source size, no claim");

assert.equal(formatBytes(900), "900 B");
assert.equal(formatBytes(2048), "2 KB");
assert.equal(formatBytes(3_500_000), "3.3 MB");

console.log("format: all assertions passed");
