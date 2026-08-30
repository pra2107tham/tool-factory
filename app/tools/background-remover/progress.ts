/**
 * Turns @imgly/background-removal's raw progress callback into one line of
 * honest status text. It calls progress(key, current, total) where key is
 * `fetch:<url>` for every model/runtime file it downloads (~40MB in total,
 * across several files) and `compute:<phase>` once inference starts.
 *
 * A spinner would be a lie here: the first run is a 40MB download and people
 * need to see it moving.
 */

export type Progress = {
  /** Bytes seen per fetched file, keyed by the resource URL. */
  files: Record<string, { loaded: number; total: number }>;
  /** 0-100, monotonic — see `percent` below for why that matters. */
  percent: number;
  text: string;
  /** True once downloading is done and the model is actually running. */
  computing: boolean;
};

export const startProgress: Progress = {
  files: {},
  percent: 0,
  text: "Starting up…",
  computing: false,
};

export function advance(
  state: Progress,
  key: string,
  loaded: number,
  total: number
): Progress {
  if (key.startsWith("compute:")) {
    return {
      ...state,
      percent: 100,
      computing: true,
      text:
        key === "compute:inference"
          ? "Finding the edges…"
          : "Cutting out the subject…",
    };
  }

  if (!key.startsWith("fetch:")) return state;

  const files = { ...state.files, [key]: { loaded, total } };
  let done = 0;
  let size = 0;
  for (const f of Object.values(files)) {
    done += f.loaded;
    size += f.total;
  }

  // ponytail: percent is over the files started so far, so it would otherwise
  // slide backwards each time a new download begins. Clamping monotonically is
  // the cheap fix; a real total needs a hardcoded manifest of model sizes that
  // would rot on the next library release.
  const share = size > 0 ? Math.round((done / size) * 100) : 0;
  const percent = Math.min(99, Math.max(state.percent, share));

  return {
    files,
    percent,
    computing: false,
    text: `Downloading the cutout model — ${percent}%`,
  };
}
