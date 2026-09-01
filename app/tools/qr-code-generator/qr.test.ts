/**
 * Runnable check for the one bit of logic here that can hand someone a wrong
 * answer: the filename their download lands under. The encoding itself is the
 * `qrcode` package's job, and the preview is proof it worked.
 *
 * Run with: npx tsx app/tools/qr-code-generator/qr.test.ts
 */
import assert from "node:assert/strict";
import { fileName, LEVELS, PNG_SIZES } from "./qr";

assert.equal(fileName("https://example.com/menu", "png"), "qr-example-com-menu.png");
assert.equal(fileName("www.example.com", "svg"), "qr-example-com.svg");
assert.equal(fileName("Table 12 — Wifi", "png"), "qr-table-12-wifi.png");
assert.equal(
  fileName("!!!", "svg"),
  "qr-code.svg",
  "punctuation-only text still needs a usable name"
);
assert.equal(fileName("   ", "png"), "qr-code.png");
assert.ok(
  fileName("a".repeat(500), "png").length < 60,
  "a wall of text must not become a 500-character filename"
);

assert.deepEqual(
  LEVELS.map((l) => l.id),
  ["L", "M", "Q", "H"]
);
assert.deepEqual(PNG_SIZES, [512, 1024, 2048]);

console.log("qr: all assertions passed");
