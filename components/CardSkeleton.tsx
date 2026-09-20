"use client";

import { motion } from "framer-motion";
import { cardArtDataUri } from "@/lib/art/generate";
import { paletteFor } from "@/lib/art/palettes";
import { truncateAddress } from "@/lib/utils/format";

/**
 * The loading state is a face-down card, never a spinner (§9).
 *
 * The back already shows this wallet's own generated art, so the reveal flip
 * turns over the same object the viewer has been looking at.
 */
export function CardSkeleton({ address }: { address: string }) {
  const palette = paletteFor("CHAIN TOURIST");
  const art = cardArtDataUri(address, palette, "rare");

  return (
    <div className="card-stage">
      <motion.div
        className="battle-card rarity--rare"
        style={
          {
            "--accent": palette.accent,
            "--glow": palette.glow,
            backgroundImage: undefined,
          } as React.CSSProperties
        }
        animate={{ rotateY: [0, 4, 0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="battle-card__inner"
          style={{
            backgroundImage: `url("${art}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              height: "100%",
              background: "linear-gradient(180deg, rgba(8,8,11,0.55), rgba(8,8,11,0.88))",
            }}
          >
            <span
              className="display"
              style={{ fontSize: 26, color: palette.accent, letterSpacing: "0.18em" }}
            >
              The chain remembers
            </span>
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              {truncateAddress(address)}
            </span>
            <div style={{ display: "grid", gap: 6, width: "62%", marginTop: 8 }}>
              {[0, 1, 2, 3, 4].map((row) => (
                <div
                  key={row}
                  className="skeleton-line"
                  style={{ height: 3, animationDelay: `${row * 0.12}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
