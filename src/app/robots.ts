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
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://apex.legal"}/sitemap.xml`,
  };
}
