/**
 * Runnable check for the one piece of logic that can silently lie to the user:
 * the download progress line. If it slides backwards or sticks at 0% during a
 * 40MB fetch, people close the tab.
 * Run with: npx tsx app/tools/background-remover/progress.test.ts
 *
 * The segmentation itself isn't tested — it's a WASM model that needs a DOM
 * and a 40MB download, and it either produces a cutout or throws.
 */
import assert from "node:assert/strict";
import { advance, startProgress } from "./progress";

// A single file downloading.
let s = advance(startProgress, "fetch:model.onnx", 0, 1000);
assert.equal(s.percent, 0, "starts at zero");
assert.match(s.text, /Downloading/, "says what is downloading");

s = advance(s, "fetch:model.onnx", 500, 1000);
assert.equal(s.percent, 50, "halfway through one file");
assert.equal(s.text, "Downloading the cutout model — 50%", "percent is in the text");

// A second file starting must not throw the bar backwards.
const before = s.percent;
s = advance(s, "fetch:runtime.wasm", 0, 3000);
assert.ok(s.percent >= before, `percent never decreases (${before} -> ${s.percent})`);

s = advance(s, "fetch:model.onnx", 1000, 1000);
s = advance(s, "fetch:runtime.wasm", 3000, 3000);
assert.equal(s.percent, 99, "downloads cap at 99 — 100 is reserved for the model running");
assert.equal(s.computing, false, "still downloading");

// Compute phases take over once the files are in.
s = advance(s, "compute:inference", 0, 1);
assert.equal(s.computing, true, "switches to computing");
assert.equal(s.text, "Finding the edges…", "inference has its own wording");
s = advance(s, "compute:mask", 0, 1);
assert.equal(s.text, "Cutting out the subject…", "later phases share one line");

// Divide-by-zero and unknown keys are real: a 0-byte content-length happens on
// cached responses, and the library adds phases between versions.
assert.equal(advance(startProgress, "fetch:x", 0, 0).percent, 0, "no size, no crash");
assert.deepEqual(advance(s, "mystery:thing", 1, 2), s, "unknown keys change nothing");

console.log("progress: all assertions passed");
