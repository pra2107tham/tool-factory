"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  count,
  PRESETS,
  readingTime,
  speakingTime,
  target,
  type Preset,
} from "./count";

const ACCENT = "#2F5FE0";

export function Counter() {
  const [text, setText] = useState("");
  const [presetId, setPresetId] = useState("none");
  const [customLimit, setCustomLimit] = useState("500");
  const [customUnit, setCustomUnit] = useState<Preset["unit"]>("words");

  // Every count is derived from the text, so there is nothing to keep in sync
  // and nothing to debounce — a keystroke re-renders with the new numbers.
  const c = useMemo(() => count(text), [text]);

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const unit = preset.id === "custom" ? customUnit : preset.unit;
  const limit =
    preset.id === "custom" ? Math.max(0, Math.floor(Number(customLimit) || 0)) : preset.limit;
  const used = unit === "chars" ? c.chars : c.words;
  const t = target(used, limit, unit);
  const showTarget = limit > 0;

  const stats = [
    { label: "Words", value: c.words },
    { label: "Characters", value: c.chars },
    { label: "No spaces", value: c.charsNoSpaces },
    { label: "Sentences", value: c.sentences },
    { label: "Paragraphs", value: c.paragraphs },
  ];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <label htmlFor="wc-text" className="sr-only">
          Your text
        </label>
        <textarea
          id="wc-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          spellCheck={false}
          placeholder="Paste or type your text here. The counts update as you go."
          className="block min-h-[45vh] w-full resize-y rounded-xl bg-transparent p-4 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-[#2F5FE0]/40 sm:min-h-[38vh] sm:p-5"
        />

        <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-5">
          {/* Five cells over two mobile columns: the last one takes the whole row. */}
          {stats.map((s) => (
            <div key={s.label} className="bg-card px-4 py-3 last:col-span-2 sm:last:col-span-1">
              <div className="font-mono text-2xl tabular-nums text-foreground">
                {s.value.toLocaleString()}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-1 text-sm text-muted-foreground">
        <span>
          <strong className="font-medium text-foreground">{readingTime(c.words)}</strong> read
        </span>
        <span>
          <strong className="font-medium text-foreground">{speakingTime(c.words)}</strong> spoken
          aloud
        </span>
        {text && (
          <button
            type="button"
            onClick={() => setText("")}
            className="ml-auto rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-[#2F5FE0]/40 focus-visible:outline-none"
          >
            Clear text
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-medium text-foreground">Hitting a limit?</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant={p.id === presetId ? "default" : "outline"}
              onClick={() => setPresetId(p.id)}
              aria-pressed={p.id === presetId}
            >
              {p.label}
              {p.limit > 0 && (
                <span className="ml-1 font-mono text-[0.7rem] opacity-70">
                  {p.limit} {p.unit === "chars" ? "ch" : "w"}
                </span>
              )}
            </Button>
          ))}
        </div>

        {presetId === "custom" && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor="wc-limit" className="text-muted-foreground">
              Limit
            </label>
            <input
              id="wc-limit"
              type="number"
              min={0}
              inputMode="numeric"
              value={customLimit}
              onChange={(e) => setCustomLimit(e.target.value)}
              className="h-8 w-24 rounded-lg border border-input bg-background px-2 font-mono tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-[#2F5FE0]/40"
            />
            <label htmlFor="wc-unit" className="sr-only">
              Count in
            </label>
            <select
              id="wc-unit"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value as Preset["unit"])}
              className="h-8 rounded-lg border border-input bg-background px-2 outline-none focus-visible:ring-3 focus-visible:ring-[#2F5FE0]/40"
            >
              <option value="words">words</option>
              <option value="chars">characters</option>
            </select>
          </div>
        )}

        {showTarget && (
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-150"
                style={{
                  width: `${t.ratio * 100}%`,
                  backgroundColor: t.over ? "var(--destructive)" : ACCENT,
                }}
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-3 text-sm">
              {/* The one number worth announcing: whether you're still inside the limit. */}
              <span
                role="status"
                className={`font-medium ${t.over ? "text-destructive" : "text-foreground"}`}
              >
                {t.label}
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {used.toLocaleString()} / {limit.toLocaleString()}{" "}
                {unit === "chars" ? "characters" : "words"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
