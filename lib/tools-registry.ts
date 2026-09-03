export type Tool = {
  slug: string;
  title: string;
  oneLiner: string;
  day: number; // which day (1-30) of the streak this shipped on
  live: boolean; // flip true once merged + promoted to production
  relatedSlugs?: string[]; // 2-3 related tools, for internal cross-linking
};

// The daily pipeline appends one entry here per successful build.
// The homepage, app/sitemap.ts, and each tool's "related tools" section
// all read from this one list — nothing else should hardcode tool metadata.
export const tools: Tool[] = [
  {
    slug: "file-size-reducer",
    title: "File Size Reducer",
    oneLiner: "Drop an image, get three smaller versions instantly.",
    day: 1,
    live: true,
    relatedSlugs: ["pdf-merger", "pdf-splitter"],
  },
  {
    slug: "pdf-merger",
    title: "PDF Merger",
    oneLiner: "Combine multiple PDFs into one, in the order you drag them.",
    day: 2,
    live: true,
    relatedSlugs: ["pdf-splitter", "file-size-reducer"],
  },
  {
    slug: "pdf-splitter",
    title: "PDF Splitter",
    oneLiner: "Pull the pages you need out of a PDF into a new file.",
    day: 3,
    live: true,
    relatedSlugs: ["pdf-merger", "file-size-reducer"],
  },
  {
    slug: "background-remover",
    title: "Background Remover",
    oneLiner: "Drop a photo, get the subject cut out as a transparent PNG.",
    day: 4,
    live: true,
    relatedSlugs: ["file-size-reducer", "pdf-merger", "pdf-splitter"],
  },
  {
    slug: "image-format-converter",
    title: "Image Format Converter",
    oneLiner: "Convert images between PNG, JPG, WebP, and AVIF in your browser.",
    day: 5,
    live: true,
    relatedSlugs: ["background-remover", "file-size-reducer", "pdf-merger"],
  },
  {
    slug: "qr-code-generator",
    title: "QR Code Generator",
    oneLiner: "Turn any link or text into a PNG or SVG QR code that never expires.",
    day: 6,
    live: true,
    relatedSlugs: ["image-format-converter", "file-size-reducer", "background-remover"],
  },
  {
    slug: "word-counter",
    title: "Word Counter",
    oneLiner: "Live word, character, and reading-time counts as you type.",
    day: 7,
    live: true,
    relatedSlugs: ["qr-code-generator", "pdf-merger", "image-format-converter"],
  },
];

export const TOTAL_DAYS = 30;

export function liveTools() {
  return tools.filter((t) => t.live);
}

export function relatedTools(slug: string, count = 3): Tool[] {
  const current = tools.find((t) => t.slug === slug);
  const others = liveTools().filter((t) => t.slug !== slug);

  if (current?.relatedSlugs?.length) {
    const named = current.relatedSlugs
      .map((s) => tools.find((t) => t.slug === s))
      .filter((t): t is Tool => Boolean(t));
    if (named.length) return named.slice(0, count);
  }
  return others.slice(0, count);
}
