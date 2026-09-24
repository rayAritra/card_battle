import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * This app renders attacker-influenced strings (ENS names, token symbols) and
 * is embedded as a Farcaster frame, so the two things worth being strict about
 * are what can be injected and who can frame it.
 *
 * `frame-ancestors` is deliberately permissive rather than DENY: the product is
 * meant to be embedded in Farcaster clients, and X-Frame-Options cannot express
 * that. Clickjacking risk is low because there is nothing to hijack — no
 * session, no cookie, no authenticated action. The one signed action lives on
 * /settings, which shows the wallet its full message before signing.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const config: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Generated images are deterministic for a given card, so they can sit
        // in a CDN. The card page itself stays dynamic.
        source: "/api/og/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default config;
