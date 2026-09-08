"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, lineRange } from "./format";

// A code tool gets a code-tool surface: a cool slate panel sitting on the site's
// warm page, with exactly one semantic colour on screen at a time.
const INK = "#0F172A"; // panel ground
const RULE = "#1E293B"; // panel chrome, borders, gutter
const CODE = "#E2E8F0"; // the JSON itself
const MUTED = "#8FA3BC"; // labels, line numbers
const VALID = "#34D399"; // green: it parsed
const INVALID = "#FBBF24"; // amber: it didn't

// Both panes are 16px/24px mono — the gutter only lines up with the textarea if
// the two share a line height, and 16px is also what stops iOS zooming on focus.
const LINE_HEIGHT = 24;
const PAD_TOP = 16;

export function Formatter() {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [minify, setMinify] = useState(false);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Parsing a megabyte of JSON on every keystroke is the one thing that could
  // make this feel slow, so the input settles first.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(input), 150);
    return () => clearTimeout(id);
  }, [input]);

  const result = useMemo(() => format(debounced, minify), [debounced, minify]);
  const idle = !debounced.trim();
  const errorLine = !result.ok ? (result.position?.line ?? null) : null;

  // Line numbers follow the box you're typing in, not the debounced copy, or
  // they'd lag a keystroke behind the text beside them.
  const lineCount = input.split("\n").length;

  useEffect(() => {
    setCopied(false);
  }, [result]);

  function jumpToError() {
    const ta = textareaRef.current;
    if (!ta || !errorLine) return;
    const [start, end] = lineRange(input, errorLine);
    ta.focus();
    ta.setSelectionRange(start, end); // native selection does the highlighting
    ta.scrollTop = Math.max(0, (errorLine - 1) * LINE_HEIGHT - ta.clientHeight / 3);
  }

  async function copy() {
    if (!result.ok) return;
    await navigator.clipboard.writeText(result.output);
    setCopied(true);
  }

  function download() {
    if (!result.ok) return;
    const url = URL.createObjectURL(new Blob([result.output], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = minify ? "minified.json" : "formatted.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const status = idle
    ? { colour: MUTED, label: "Waiting for JSON", detail: "Paste anything — it checks as you type." }
    : result.ok
      ? {
          colour: VALID,
          label: "Valid JSON",
          detail: `${result.output.split("\n").length.toLocaleString()} lines · ${result.output.length.toLocaleString()} characters`,
        }
      : {
          colour: INVALID,
          label: "Invalid JSON",
          detail: result.position
            ? `Line ${result.position.line}, column ${result.position.column}`
            : "The parser couldn't say where",
        };

  return (
    <div className="overflow-hidden rounded-2xl shadow-sm" style={{ backgroundColor: INK }}>
      {/* The signature moment: this bar flips the instant a paste lands. */}
      <div
        role="status"
        aria-live="polite"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 sm:px-5"
        style={{ borderBottom: `1px solid ${RULE}` }}
      >
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full motion-safe:transition-colors motion-safe:duration-200"
          style={{ backgroundColor: status.colour }}
        />
        <span
          className="font-mono text-sm font-medium motion-safe:transition-colors motion-safe:duration-200"
          style={{ color: status.colour }}
        >
          {status.label}
        </span>
        <span className="font-mono text-xs" style={{ color: MUTED }}>
          {status.detail}
        </span>
      </div>

      <div className="grid lg:grid-cols-2">
        {/* Input */}
        <div className="border-b lg:border-b-0" style={{ borderColor: RULE }}>
          <PanelHead title="Your JSON">
            {input && (
              <PanelButton onClick={() => setInput("")} label="Clear" />
            )}
          </PanelHead>

          <div className="flex" style={{ height: "42vh", minHeight: 260 }}>
            <div
              ref={gutterRef}
              aria-hidden
              className="shrink-0 overflow-hidden text-right font-mono text-base select-none"
              style={{
                width: 52,
                paddingTop: PAD_TOP,
                paddingBottom: PAD_TOP,
                lineHeight: `${LINE_HEIGHT}px`,
                color: MUTED,
                backgroundColor: RULE,
              }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div
                  key={i}
                  className="pr-3"
                  style={
                    i + 1 === errorLine
                      ? { color: INK, backgroundColor: INVALID, fontWeight: 600 }
                      : undefined
                  }
                >
                  {i + 1}
                </div>
              ))}
            </div>

            <label htmlFor="json-in" className="sr-only">
              JSON to format
            </label>
            <textarea
              id="json-in"
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onScroll={(e) => {
                if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
              }}
              autoFocus
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={'{"paste":"your JSON here"}'}
              className="block h-full w-full resize-none border-0 bg-transparent px-3 font-mono text-base outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-inset"
              style={{
                paddingTop: PAD_TOP,
                paddingBottom: PAD_TOP,
                lineHeight: `${LINE_HEIGHT}px`,
                color: CODE,
                caretColor: VALID, // #34D399 — the same green the status bar uses
              }}
            />
          </div>
        </div>

        {/* Output */}
        <div className="lg:border-l" style={{ borderColor: RULE }}>
          <PanelHead title={minify ? "Minified" : "Formatted"}>
            <label
              className="flex cursor-pointer items-center gap-1.5 font-mono text-xs"
              style={{ color: MUTED }}
            >
              <input
                type="checkbox"
                checked={minify}
                onChange={(e) => setMinify(e.target.checked)}
                className="size-3.5 accent-emerald-400"
              />
              Minify
            </label>
            <PanelButton onClick={copy} label={copied ? "Copied" : "Copy JSON"} disabled={!result.ok} />
            <PanelButton onClick={download} label="Download .json" disabled={!result.ok} />
          </PanelHead>

          <div className="overflow-auto" style={{ height: "42vh", minHeight: 260, padding: PAD_TOP }}>
            {result.ok ? (
              <pre
                className="font-mono text-base whitespace-pre"
                style={{ lineHeight: `${LINE_HEIGHT}px`, color: CODE }}
              >
                {result.output}
              </pre>
            ) : idle ? (
              <p className="font-mono text-sm" style={{ color: MUTED }}>
                The formatted JSON shows up here, indented two spaces.
              </p>
            ) : (
              <div className="font-mono text-sm" style={{ color: CODE }}>
                <p style={{ color: INVALID }}>{result.message}</p>
                {result.position ? (
                  <>
                    <p className="mt-2" style={{ color: MUTED }}>
                      Line {result.position.line}, column {result.position.column} (character{" "}
                      {result.position.offset.toLocaleString()}).
                    </p>
                    <button
                      type="button"
                      onClick={jumpToError}
                      className="mt-3 rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ backgroundColor: INVALID, color: INK, outlineColor: INVALID }}
                    >
                      Jump to line {result.position.line}
                    </button>
                  </>
                ) : (
                  <p className="mt-2" style={{ color: MUTED }}>
                    Your browser didn&rsquo;t report a position for this one. Check for a missing
                    closing brace or bracket at the end.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 px-3 py-2"
      style={{ borderBottom: `1px solid ${RULE}` }}
    >
      <span className="mr-auto font-mono text-xs tracking-wider uppercase" style={{ color: MUTED }}>
        {title}
      </span>
      {children}
    </div>
  );
}

function PanelButton({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md px-2.5 py-1 font-mono text-xs focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
      style={{ backgroundColor: RULE, color: CODE, outlineColor: VALID }}
    >
      {label}
    </button>
  );
}
