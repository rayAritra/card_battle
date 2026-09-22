"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import styles from "./SiteBackground.module.css";

/** The looping video backdrop, fixed behind every page — not just the
 * homepage — so navigating the site never cuts back to a flat page. Rendered
 * once in app/layout.tsx as a sibling of <main>, the same fixed-behind-content
 * pattern the old `.arenaGrid` grid used before this replaced it. */
export function SiteBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();

  // A visitor who asked for less motion gets the first frame, not a paused
  // spinner — the video element still loads, it just never plays.
  useEffect(() => {
    if (reducedMotion) videoRef.current?.pause();
  }, [reducedMotion]);

  // Slower than native — the footage reads as ambient texture, not footage
  // someone is meant to actually watch.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = 0.35;
  }, []);

  return (
    <div className={styles.siteBg} aria-hidden="true">
      <video
        ref={videoRef}
        className={styles.siteBgVideo}
        src="/video/home-hero-bg.mp4"
        autoPlay={!reducedMotion}
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className={styles.siteBgTint} />
      <div className={styles.siteBgGrain} />
    </div>
  );
}
