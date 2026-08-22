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
  // {
  //   slug: "file-size-reducer",
  //   title: "File Size Reducer",
  //   oneLiner: "Drop any file, get three smaller versions instantly.",
  //   day: 1,
  //   live: true,
  //   relatedSlugs: [],
  // },
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
