import { ImageResponse } from "next/og";

/**
 * The browser tab icon, generated rather than shipped as a file.
 *
 * There is no `public/` directory in this project and the card artwork is
 * already generated SVG, so adding a binary asset just for the favicon would
 * be the only one of its kind. Next serves this at /icon and wires the link
 * tag automatically.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
          border: "1.5px solid #FFD400",
          color: "#FFD400",
          fontSize: 19,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        B
      </div>
    ),
    size,
  );
}
