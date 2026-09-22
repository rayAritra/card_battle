import { ImageResponse } from "next/og";

export const runtime = "nodejs";

/**
 * Square app icon for the Farcaster Mini App manifest and link previews.
 *
 * Drawn as shapes rather than a glyph: @vercel/og resolves fonts for text at
 * render time, and a decorative character can fail that lookup.
 */
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08080B",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 240,
            height: 240,
            transform: "rotate(45deg)",
            borderRadius: 28,
            border: "18px solid #FFD400",
            background: "rgba(255,212,0,0.12)",
          }}
        />
      </div>
    ),
    { width: 512, height: 512 },
  );
}
