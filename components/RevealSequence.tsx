"use client";

import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Card } from "@/types";
import { cardArtDataUri } from "@/lib/art/generate";
import { paletteFor } from "@/lib/art/palettes";
import { BattleCard } from "./BattleCard";

/**
 * The staged card reveal (§9).
 *
 * The card starts face-down showing its own generated art, flips at 700ms, and
 * the interior stages — frame sweep, archetype, level count, stat stagger,
 * ability, rarity flourish — are timed by BattleCard's own delays so the two
 * halves stay in lockstep.
 *
 * Under prefers-reduced-motion the whole sequence collapses to a short fade.
 */
export function RevealSequence({ card, children }: { card: Card; children?: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  // The front face stays `backface-visibility: hidden` only for the flip
  // itself. Left on permanently, it clips the interactive tilt's corners on
  // hover in Chrome/WebKit, which compute a backface-hidden element's
  // compositing bounds from its own (untransformed) box rather than the
  // child's live rotated extent.
  const [settled, setSettled] = useState(false);
  const [sweepScope, animateSweep] = useAnimate<HTMLDivElement>();

  const palette = paletteFor(card.archetype);
  const backArt = cardArtDataUri(card.address, palette, card.rarity);

  useEffect(() => {
    const timer = window.setTimeout(() => setFlipped(true), reduced ? 0 : 60);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  // The frame-sweep wipe below animates `clip-path` to reveal the card's
  // border. Framer Motion leaves that final clip-path value sitting on the
  // element as an inline style forever — a clip region that exactly matches
  // the card's own static (untilted) box. Once the interactive hover-tilt
  // later rotates/scales the card beyond that frozen box, the clip silently
  // slices off whatever pokes past it. Driving the animation imperatively
  // lets it be cleared to `none` the moment the wipe finishes, on the same
  // DOM node, so nothing about the card remounts or loses state.
  useEffect(() => {
    if (reduced || !flipped || !sweepScope.current) return;
    let cancelled = false;
    animateSweep(
      sweepScope.current,
      { clipPath: "inset(0% 0% 0% 0%)" },
      { delay: 0.35, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    ).then(() => {
      if (!cancelled && sweepScope.current) sweepScope.current.style.clipPath = "none";
    });
    return () => {
      cancelled = true;
    };
    // Fires once, when the flip starts; animateSweep is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, reduced]);

  if (reduced) {
    return (
      <motion.div
        className="perspective-[1000px] w-[min(100%,380px)] mx-auto overflow-visible"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.14 }}
      >
        <BattleCard card={card} animate={false} />
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className="perspective-[1000px] w-[min(100%,380px)] mx-auto overflow-visible"
      style={{ perspective: 1200 }}
    >
      <motion.div
        // `preserve-3d` is only needed while the flip itself is live. Left on
        // permanently, it nests the outer flip's 3D space with the battle
        // card's own independent `perspective()` transform (baked into its
        // own `transform`, self-contained) — a redundant nested 3D context
        // that Chromium's compositor sometimes flattens/re-clips incorrectly
        // mid-frame once the hover-tilt starts updating every frame, cutting
        // off whichever edge is currently tilting toward or away from the
        // viewer. Flattening this wrapper once the flip settles removes that
        // second context entirely; the card's own tilt is unaffected because
        // it never depended on this ancestor's 3D space to begin with.
        style={{ transformStyle: settled ? "flat" : "preserve-3d", position: "relative" }}
        initial={{ rotateY: 180 }}
        animate={{ rotateY: flipped ? 0 : 180 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => setSettled(true)}
      >
        {/* Face-down back, hidden once the flip passes 90 degrees. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: "var(--radius-card)",
            backgroundImage: `url("${backArt}")`,
            backgroundSize: "cover",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />

        <div style={{ backfaceVisibility: settled ? "visible" : "hidden" }}>
          {/* Frame sweep: a clip-path wipe that draws the border in at 350ms,
              cleared back to no clip once it finishes — see the effect above. */}
          <div ref={sweepScope} style={{ clipPath: "inset(0% 100% 0% 0%)" }}>
            <BattleCard card={card} animate />
          </div>

          {/* Rarity flourish: one holo sweep across epic and above at 1600ms. */}
          {card.rarity !== "common" && card.rarity !== "rare" && (
            <motion.div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 12,
                pointerEvents: "none",
                borderRadius: "var(--radius-card)",
                background:
                  "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.5) 50%, transparent 65%)",
                mixBlendMode: "color-dodge",
              }}
              initial={{ x: "-120%", opacity: 0 }}
              animate={{ x: "120%", opacity: [0, 1, 0] }}
              transition={{ delay: 1.6, duration: 0.9, ease: "easeInOut" }}
            />
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.9, duration: 0.4 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
