import type { MetadataRoute } from "next";

/** Generates the robots.txt rules, disallowing private routes and pointing to the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/legal/", "/api/", "/login"],
      },
    ],
    sitemap: "https://apex.legal/sitemap.xml",
  };
}
