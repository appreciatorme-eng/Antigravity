// Programmatic sitemap for marketing and public pages.
// Next.js App Router auto-serves this at /sitemap.xml.

import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://travelsuite-rust.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const marketingPages = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/pricing", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/demo", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/solutions/solo", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/solutions/agency", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/solutions/tmc", priority: 0.8, changeFrequency: "monthly" as const },
  ];

  return marketingPages.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
