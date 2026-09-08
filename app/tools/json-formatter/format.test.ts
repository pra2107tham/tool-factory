/**
 * The line/column maths is the whole product — a parse that works but points at
 * the wrong line is worse than no tool. Run with:
 *   npx tsx app/tools/json-formatter/format.test.ts
 */
import assert from "node:assert/strict";
import { format, lineRange, offsetToPosition } from "./format";

// --- offsets -> line/column ---------------------------------------------
assert.deepEqual(offsetToPosition("abc", 0), { line: 1, column: 1, offset: 0 });
assert.deepEqual(offsetToPosition("a\nbc", 3), { line: 2, column: 2, offset: 3 });
assert.deepEqual(offsetToPosition("a\n\nb", 3), { line: 3, column: 1, offset: 3 });
assert.deepEqual(offsetToPosition("ab", 99), { line: 1, column: 3, offset: 2 }, "clamped to the end");

// --- formatting ---------------------------------------------------------
const pretty = format('{"a":[1,2],"b":{"c":true}}');
assert.equal(pretty.ok, true);
assert.equal(
  pretty.ok && pretty.output,
  '{\n  "a": [\n    1,\n    2\n  ],\n  "b": {\n    "c": true\n  }\n}'
);
const minified = format('{ "a" : 1 }', true);
assert.equal(minified.ok && minified.output, '{"a":1}');
const bare = format("  42  ");
assert.equal(bare.ok && bare.output, "42", "a bare value is valid JSON");
assert.equal(format('"héllo 👋"').ok, true);

// --- errors point at the right place ------------------------------------
// Line 3 is `  "b" 2`: the colon is missing after "b".
const broken = format('{\n  "a": 1,\n  "b" 2\n}');
assert.equal(broken.ok, false);
if (!broken.ok) {
  assert.ok(broken.position, "V8 and Firefox both report a location");
  assert.equal(broken.position!.line, 3);
  assert.ok(broken.position!.column > 1);
  assert.ok(broken.message.length > 0);
  assert.ok(!/position \d+/.test(broken.message), "the raw offset is stripped from the message");
  assert.ok(!/line \d+ column/.test(broken.message), "so is the raw line/column");
  assert.equal(broken.message[0], broken.message[0].toUpperCase());
}

const trailingComma = format('{"a": 1,}');
assert.equal(trailingComma.ok, false);
assert.equal(!trailingComma.ok && trailingComma.position?.line, 1);

// Empty input has no position to point at, and must not throw on the way out.
const empty = format("");
assert.equal(empty.ok, false);
assert.ok(!empty.ok && empty.message.length > 0);

// --- jump-to-line selection ---------------------------------------------
const doc = "one\ntwo\nthree";
assert.deepEqual(lineRange(doc, 1), [0, 3]);
assert.deepEqual(lineRange(doc, 2), [4, 7]);
assert.deepEqual(lineRange(doc, 3), [8, 13], "the last line runs to the end");

console.log("format.test.ts: all assertions passed");
