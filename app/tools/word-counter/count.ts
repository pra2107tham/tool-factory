/** Counting, target maths, and the plain-English time strings. No React here,
 *  so `count.test.ts` can run the whole thing under `node`. */

export type Counts = {
  words: number;
  chars: number;
  charsNoSpaces: number;
  sentences: number;
  paragraphs: number;
};

// Segmenters are expensive to build and stateless once built — one each, reused
// on every keystroke. `undefined` locale means "the reader's", which is what
// decides how CJK text is split.
let wordSeg: Intl.Segmenter | undefined;
let sentenceSeg: Intl.Segmenter | undefined;

export function count(text: string): Counts {
  if (!text.trim()) {
    return { words: 0, chars: text.length, charsNoSpaces: 0, sentences: 0, paragraphs: 0 };
  }

  wordSeg ??= new Intl.Segmenter(undefined, { granularity: "word" });
  sentenceSeg ??= new Intl.Segmenter(undefined, { granularity: "sentence" });

  // Word-like segments, except that "state-of-the-art" arrives as four of them
  // joined by hyphens and is one word to the person counting (and to Word).
  let words = 0;
  let afterJoiningHyphen = false;
  let prevWordLike = false;
  for (const s of wordSeg.segment(text)) {
    if (s.isWordLike) {
      if (!afterJoiningHyphen) words++;
      afterJoiningHyphen = false;
      prevWordLike = true;
    } else {
      afterJoiningHyphen = prevWordLike && s.segment === "-";
      prevWordLike = false;
    }
  }

  let sentences = 0;
  for (const s of sentenceSeg.segment(text)) if (s.segment.trim()) sentences++;

  return {
    words,
    // Array.from, not `.length`: an emoji is one character to a human and two
    // to `String.prototype.length`.
    chars: Array.from(text).length,
    charsNoSpaces: Array.from(text.replace(/\s/g, "")).length,
    sentences,
    paragraphs: text.split(/\n+/).filter((p) => p.trim()).length,
  };
}

const READING_WPM = 200;
const SPEAKING_WPM = 130;

/** "under a minute" / "about 1 min" / "about 12 min" — never "0 min". */
export function duration(words: number, wpm: number): string {
  if (words === 0) return "—";
  const minutes = Math.round(words / wpm);
  if (minutes < 1) return "under a minute";
  return `about ${minutes} min`;
}

export const readingTime = (words: number) => duration(words, READING_WPM);
export const speakingTime = (words: number) => duration(words, SPEAKING_WPM);

export type Preset = {
  id: string;
  label: string;
  limit: number;
  unit: "chars" | "words";
};

export const PRESETS: Preset[] = [
  { id: "none", label: "No limit", limit: 0, unit: "chars" },
  { id: "tweet", label: "Tweet", limit: 280, unit: "chars" },
  { id: "meta", label: "Meta description", limit: 160, unit: "chars" },
  { id: "essay", label: "500-word essay", limit: 500, unit: "words" },
  { id: "custom", label: "Custom", limit: 0, unit: "words" },
];

/** Progress toward a target, plus the line that goes next to the bar. */
export function target(used: number, limit: number, unit: Preset["unit"]) {
  const noun = unit === "chars" ? "character" : "word";
  const left = limit - used;
  const over = left < 0;
  const n = Math.abs(left);
  return {
    over,
    // Capped so the bar never overflows its track; `over` carries the rest.
    ratio: limit > 0 ? Math.min(used / limit, 1) : 0,
    label: over
      ? `${n} ${noun}${n === 1 ? "" : "s"} over`
      : `${n} ${noun}${n === 1 ? "" : "s"} to go`,
  };
}
