import type { MetadataRoute } from "next";
import { MODULES } from "@/modules/registry";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://react-rendering-lab.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const STATIC: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/lab/journey`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const modules: MetadataRoute.Sitemap = MODULES.map((m) => ({
    url: `${SITE_URL}/lab/${m.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...STATIC, ...modules];
}
