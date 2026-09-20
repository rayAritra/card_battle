import type { MetadataRoute } from "next";

/**
 * PWA manifest, so the app can be installed to a phone home screen.
 *
 * The icon is the same generated route the Farcaster manifest points at, which
 * keeps one source of truth and avoids shipping a binary asset.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Onchain Battle Cards",
    short_name: "Battle Cards",
    description:
      "Turn any EVM wallet into a collectible battle card generated from its real onchain history.",
    start_url: "/",
    display: "standalone",
    background_color: "#08080b",
    theme_color: "#08080b",
    orientation: "portrait",
    categories: ["entertainment", "games"],
    icons: [
      { src: "/api/icon", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
