import type { MetadataRoute } from "next";

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
