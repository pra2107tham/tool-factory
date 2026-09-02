/**
 * The counts are the product — a wrong number here is the only way this tool
 * can fail. Run with: npx tsx app/tools/word-counter/count.test.ts
 */
import assert from "node:assert/strict";
import { count, duration, readingTime, speakingTime, target } from "./count";

const empty = count("");
assert.deepEqual(empty, {
  words: 0,
  chars: 0,
  charsNoSpaces: 0,
  sentences: 0,
  paragraphs: 0,
});
assert.equal(count("   \n  ").words, 0, "whitespace alone is not a word");

const basic = count("Hello, world! How are you?");
assert.equal(basic.words, 5, "punctuation is not a word");
assert.equal(basic.chars, 26);
assert.equal(basic.charsNoSpaces, 22);
assert.equal(basic.sentences, 2);
assert.equal(basic.paragraphs, 1);

// The reason for Intl.Segmenter over /\S+/: neither of these splits on spaces.
// Two words, not four characters and not one blob: CJK has no spaces to split
// on, so the segmenter's dictionary is doing the work a /\S+/ regex can't.
assert.equal(count("你好世界").words, 2);
assert.equal(count("it's a well-known state-of-the-art idea").words, 5, "hyphenates are one word each");
assert.equal(count("Pi is 3.14 — roughly.").words, 4, "a decimal is one word, a dash is none");
assert.equal(count("- one\n- two").words, 2, "leading bullet hyphens join nothing");

const multi = count("First para.\n\nSecond para, two sentences. Here's the second.");
assert.equal(multi.paragraphs, 2, "blank lines between blocks make one gap, not two");
assert.equal(multi.sentences, 3);
assert.equal(count("Line one\nLine two\nLine three").paragraphs, 3);

// One emoji is one character to the person counting, not two code units.
assert.equal(count("hi 👋").chars, 4);

assert.equal(duration(0, 200), "—");
assert.equal(duration(10, 200), "under a minute", "never round a real count to 0 min");
assert.equal(readingTime(200), "about 1 min");
assert.equal(readingTime(2400), "about 12 min");
assert.equal(speakingTime(130), "about 1 min", "speaking is slower than reading");

assert.deepEqual(target(138, 280, "chars"), {
  over: false,
  ratio: 138 / 280,
  label: "142 characters to go",
});
assert.equal(target(303, 280, "chars").label, "23 characters over");
assert.equal(target(303, 280, "chars").over, true);
assert.equal(target(303, 280, "chars").ratio, 1, "the bar must not overflow its track");
assert.equal(target(499, 500, "words").label, "1 word to go", "singular, not '1 words'");
assert.equal(target(280, 280, "chars").label, "0 characters to go", "exactly at the limit");
assert.equal(target(10, 0, "words").ratio, 0, "no limit set means no progress");

console.log("word-counter: all checks passed");
