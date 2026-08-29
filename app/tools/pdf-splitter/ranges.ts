/**
 * The range string ("1-3, 7, 12-15") and the thumbnail grid are two views of
 * one Set of 0-based page indices. These two functions are the bridge, and
 * they're the only real logic in this tool — hence ranges.test.ts.
 */

/**
 * Lenient by design: this runs on every keystroke, so half-typed input like
 * "1-" or "4," must parse to something sensible rather than throw. Anything
 * unparseable or outside the document is dropped silently — the thumbnails
 * are the feedback channel, not an error message.
 */
export function parseRanges(input: string, pageCount: number): Set<number> {
  const pages = new Set<number>();

  for (const token of input.split(",")) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    const match = /^(\d+)\s*(?:-\s*(\d+)?)?$/.exec(trimmed);
    if (!match) continue;

    const start = Number(match[1]);
    // "5-" while still typing means just page 5, not 5-to-end.
    const end = match[2] ? Number(match[2]) : start;
    // Accept reversed input ("7-3") rather than discarding it.
    const [lo, hi] = start <= end ? [start, end] : [end, start];

    for (let p = Math.max(1, lo); p <= Math.min(pageCount, hi); p++) {
      pages.add(p - 1);
    }
  }

  return pages;
}

/** Inverse of parseRanges: collapses consecutive pages back into "1-3, 7". */
export function formatRanges(pages: Set<number>): string {
  const sorted = [...pages].sort((a, b) => a - b);
  if (!sorted.length) return "";

  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (const page of sorted.slice(1)) {
    if (page === prev + 1) {
      prev = page;
      continue;
    }
    parts.push(start === prev ? `${start + 1}` : `${start + 1}-${prev + 1}`);
    start = prev = page;
  }
  parts.push(start === prev ? `${start + 1}` : `${start + 1}-${prev + 1}`);

  return parts.join(", ");
}
