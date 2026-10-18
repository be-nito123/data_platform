import type { MetadataRoute } from "next";
import { getAllInstruments } from "@/lib/instruments";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const pages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/datasets"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Every instrument has a stable terminal URL that is worth indexing.
  const instruments: MetadataRoute.Sitemap = getAllInstruments().map((instrument) => ({
    url: absoluteUrl(`/terminal/${instrument.id}`),
    lastModified,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...pages, ...instruments];
}
