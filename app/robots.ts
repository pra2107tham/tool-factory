import type { MetadataRoute } from "next";

// TODO: replace once the domain is live
const BASE_URL = "https://yourdomain.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
