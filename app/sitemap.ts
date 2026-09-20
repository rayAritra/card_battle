import type { MetadataRoute } from "next";
import { appOrigin } from "@/lib/utils/origin";

/**
 * Sitemap of the stable pages only.
 *
 * Card, battle and history URLs are deliberately absent: there is one per
 * address, they are generated on demand, and listing them would invite a
 * crawler to build every card in the database. Shared links still index
 * normally — they just are not advertised here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = appOrigin();
  const lastModified = new Date();

  return [
    { url: origin, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/how-it-works`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/archetypes`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${origin}/abilities`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${origin}/leaderboard`, lastModified, changeFrequency: "hourly", priority: 0.6 },
  ];
}
