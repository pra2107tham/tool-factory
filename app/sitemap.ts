import type { MetadataRoute } from "next";
import { liveTools } from "@/lib/tools-registry";

// Using the Vercel URL until a real domain is picked
const BASE_URL = "https://tool-factory-lac.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolEntries: MetadataRoute.Sitemap = liveTools().map((tool) => ({
    url: `${BASE_URL}/tools/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...toolEntries,
  ];
}
