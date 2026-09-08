/** Parse, re-print, and the line/column maths behind the error banner. No React
 *  here, so `format.test.ts` can run the whole thing under `node`. */

export type Position = { line: number; column: number; offset: number };

export type ParseResult =
  | { ok: true; output: string }
  | { ok: false; message: string; position: Position | null };

/** Both 1-based, the way an editor's status bar counts. */
export function offsetToPosition(text: string, offset: number): Position {
  const at = Math.max(0, Math.min(offset, text.length));
  const before = text.slice(0, at);
  const lastBreak = before.lastIndexOf("\n");
  return {
    line: before.split("\n").length,
    column: at - lastBreak, // the character just after a break is column 1
    offset: at,
  };
}

function positionToOffset(text: string, line: number, column: number): number {
  const lines = text.split("\n");
  let offset = 0;
  for (let i = 0; i < line - 1 && i < lines.length; i++) offset += lines[i].length + 1;
  return offset + column - 1;
}

/** Character range of one 1-based line, for selecting it in the textarea. */
export function lineRange(text: string, line: number): [number, number] {
  const start = positionToOffset(text, line, 1);
  const end = text.indexOf("\n", start);
  return [start, end === -1 ? text.length : end];
}

/**
 * Every engine words its parse errors differently and hides the location in a
 * different part of the sentence. V8 gives a 0-based character offset
 * ("...in JSON at position 12"), Firefox gives line/column, Safari gives
 * neither — so pull out whatever is there and strip it from the message, since
 * we render the location ourselves.
 */
function describe(err: unknown, text: string): { message: string; position: Position | null } {
  const raw = err instanceof Error ? err.message : String(err);

  const byOffset = /position (\d+)/.exec(raw);
  const byLineCol = /line (\d+) column (\d+)/.exec(raw);
  const position = byOffset
    ? offsetToPosition(text, Number(byOffset[1]))
    : byLineCol
      ? offsetToPosition(text, positionToOffset(text, Number(byLineCol[1]), Number(byLineCol[2])))
      : null;

  const message = raw
    .replace(/^JSON\.parse:\s*/, "") // Firefox
    .replace(/^JSON Parse error:\s*/, "") // Safari
    .replace(/\s*in JSON at position \d+.*$/, "") // V8
    .replace(/\s*at line \d+ column \d+ of the JSON data\.?$/, "") // Firefox
    .trim();

  const cleaned = message || raw;
  return { message: cleaned.charAt(0).toUpperCase() + cleaned.slice(1), position };
}

export function format(text: string, minify = false): ParseResult {
  try {
    const value: unknown = JSON.parse(text);
    return { ok: true, output: JSON.stringify(value, null, minify ? 0 : 2) };
  } catch (err) {
    return { ok: false, ...describe(err, text) };
  }
}
