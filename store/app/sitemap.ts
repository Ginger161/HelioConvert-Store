import type { MetadataRoute } from "next";
import { allBundles, allProducts } from "@/lib/db";
import { FORMATS } from "@/lib/formats";
import { GOALS } from "@/lib/goals";
import { STACKS } from "@/lib/stacks";
import { abs } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, bundles] = await Promise.all([allProducts(), allBundles()]);
  const now = new Date();
  return [
    { url: abs("/"), changeFrequency: "daily", priority: 1, lastModified: now },
    { url: abs("/library"), changeFrequency: "daily", priority: 0.9, lastModified: now },
    { url: abs("/bundles"), changeFrequency: "weekly", priority: 0.8, lastModified: now },
    { url: abs("/about"), changeFrequency: "monthly", priority: 0.9, lastModified: now },
    { url: abs("/start"), changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: abs("/stacks"), changeFrequency: "weekly", priority: 0.8, lastModified: now },
    ...STACKS.map((s) => ({ url: abs(`/stack/${s.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...GOALS.map((g) => ({ url: abs(`/goal/${g.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...FORMATS.map((f) => ({ url: abs(`/format/${f.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...bundles.map((b) => ({ url: abs(`/b/${b.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: abs(`/p/${p.slug}`), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
