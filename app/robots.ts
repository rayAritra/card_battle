import type { MetadataRoute } from "next";
import { appOrigin } from "@/lib/utils/origin";

/**
 * robots.txt.
 *
 * Card and history URLs are unbounded — one per address — so crawling them
 * wholesale would cost real upstream quota for pages nobody asked for. They
 * stay open to crawlers that follow a shared link (that is the whole
 * distribution model) but are kept out of blind discovery, and the API is
 * closed entirely.
 */
export default function robots(): MetadataRoute.Robots {
  const origin = appOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/settings"],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
