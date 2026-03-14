// Programmatic sitemap for marketing and public pages.
// Next.js App Router auto-serves this at /sitemap.xml.
// Includes static marketing pages + dynamic blog posts from Supabase.

import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://travelbuilt.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const marketingPages = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/pricing", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/demo", priority: 0.9, changeFrequency: "monthly" as const },
    {
      path: "/solutions/solo",
      priority: 0.8,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/solutions/agency",
      priority: 0.8,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/solutions/tmc",
      priority: 0.8,
      changeFrequency: "monthly" as const,
    },
  ];

  const staticEntries: MetadataRoute.Sitemap = marketingPages.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    })
  );

  // Fetch published blog post slugs for dynamic entries
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    // blog_posts not yet in generated types — cast .from to bypass
    const { data: posts } = await (supabase.from as (t: string) => ReturnType<typeof supabase.from>)("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (posts) {
      interface BlogPost {
        readonly slug: string;
        readonly updated_at: string | null;
        readonly published_at: string | null;
      }
      blogEntries = (posts as unknown as BlogPost[]).map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at ?? post.published_at ?? Date.now()),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // blog_posts table may not exist yet — return static entries only
  }

  return [...staticEntries, ...blogEntries];
}
