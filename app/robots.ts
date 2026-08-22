import type { MetadataRoute } from "next";

// Using the Vercel URL until a real domain is picked
const BASE_URL = "https://tool-factory-lac.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
