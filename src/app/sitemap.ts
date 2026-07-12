import type { MetadataRoute } from "next";

/** Generates the sitemap.xml entries for the public site. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://apex.legal";

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
