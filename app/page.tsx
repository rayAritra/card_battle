"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { AddressInput } from "@/components/AddressInput";
import { RecentCards } from "@/components/RecentCards";
import { ARCHETYPE_CENTROIDS } from "@/lib/stats/archetypes";
import { paletteFor } from "@/lib/art/palettes";
import { taglineFor } from "@/lib/flavor/templates";
import { Badge } from "@/components/ui/badge";
import { STAT_KEYS } from "@/types";

/** The stat with the highest weight in an archetype's centroid — its "lead". */
function leadStat(centroid: readonly number[]): string {
  const topIndex = centroid.reduce(
    (best, value, index) => (value > centroid[best] ? index : best),
    0,
  );
  return STAT_KEYS[topIndex];
}

const STEPS = [
  {
    n: "01",
    title: "Scan",
    body: "Point it at any wallet address or ENS name. We read Ethereum and Base history — no connection, no signature.",
  },
  {
    n: "02",
    title: "Forge",
    body: "Trades, holdings, protocol use and time onchain compress into five stats, an archetype, a rarity and an ability.",
  },
  {
    n: "03",
    title: "Battle",
    body: "Five rounds, seeded from both addresses. Same match every time it's opened — nothing is rolled behind the scenes.",
  },
];

const METRICS = [
  { value: "16", label: "archetypes to land on" },
  { value: "30", label: "abilities, rarest wins" },
  { value: "5", label: "stats read from real activity" },
  { value: "2", label: "chains scanned per card" },
];

const FEATURED_ARCHETYPES = ["DEFI WARLORD", "DIAMOND WHALE", "MEV GREMLIN", "GENESIS RELIC"];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgOpacity = useTransform(scrollYProgress, [0, 0.65, 1], [1, 0.35, 0]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -120]);

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
    <main className="relative">
      {/* ── Hero — full viewport height, everything else waits below the fold ── */}
      <section
        ref={heroRef}
        className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 pb-20 pt-28 text-center"
      >
        <motion.div
          aria-hidden
          className="hero-bg"
          style={{ opacity: bgOpacity, scale: bgScale, y: bgY }}
        >
          <video
            ref={videoRef}
            className="hero-bg__video"
            src="/video/home-hero-bg.mp4"
            autoPlay={!reducedMotion}
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className="hero-bg__tint" />
          <div className="hero-bg__grain" />
          <div className="hero-bg__fade" />
        </motion.div>

        <p className="enter enter-1 mono relative z-10 text-[13px] text-[var(--muted)]">
          Nothing to connect, nothing to sign — just an address
        </p>

        <h1 className="display enter enter-2 relative z-10 mt-6 text-[clamp(48px,10vw,108px)] text-[var(--text)]">
          Every wallet
          <br />
          has a legend
        </h1>

        <p className="enter enter-3 relative z-10 mx-auto mt-6 max-w-[560px] text-base leading-relaxed text-[var(--muted)]">
          Transform any wallet into a one-of-one battle card, shaped by its trades, holdings,
          protocols, risk and time onchain. Forge your identity, then put it to the test.
        </p>

        <div className="enter enter-4 relative z-10 mt-9 w-full">
          <AddressInput />
        </div>

        <motion.div
          aria-hidden
          className="absolute bottom-9 left-1/2 z-10 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="mono block text-[11px] text-[var(--muted)]">scroll</span>
          <svg width="14" height="14" viewBox="0 0 14 14" className="mx-auto mt-1 text-[var(--muted)]">
            <path d="M1 4l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </motion.div>
      </section>

      {/* ── Recently revealed — only renders once the visitor has a history ── */}
      <section className="mx-auto max-w-[1120px] px-6">
        <RecentCards />
      </section>

      {/* ── Process — a genuine sequence, so numbered blocks earn their place ── */}
      <section className="mx-auto max-w-[1120px] px-6 py-24">
        <motion.h2
          className="display text-[clamp(30px,4.5vw,48px)] text-[var(--text)]"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          From address to arena
        </motion.h2>

        <div className="seam-grid mt-12 grid-cols-1 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.n}
              className="seam-cell p-6"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              transition={{ duration: 0.45, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Badge>{step.n}</Badge>
              <h3 className="display mt-3 text-[22px] text-[var(--text)]">{step.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--muted)]">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Metrics — what the system actually measures, stated as numbers ── */}
      <section className="border-y-2 border-[var(--line)] bg-[var(--surface)]/60">
        <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-8 px-6 py-16 md:grid-cols-4">
          {METRICS.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="display block text-[clamp(34px,5vw,54px)] text-[var(--brand)]">
                {metric.value}
              </span>
              <span className="mt-1 block text-[13px] leading-snug text-[var(--muted)]">
                {metric.label}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Archetype teaser — real data, not filler ── */}
      <section className="mx-auto max-w-[1120px] px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <motion.h2
            className="display text-[clamp(30px,4.5vw,48px)] text-[var(--text)]"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            Sixteen ways to be a wallet
          </motion.h2>
          <Link href="/archetypes" className="button button--ghost">
            See all archetypes
          </Link>
        </div>

        <div className="seam-grid mt-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_ARCHETYPES.map((name, index) => {
            const palette = paletteFor(name);
            const centroid = ARCHETYPE_CENTROIDS[name] ?? [];
            return (
              <motion.div
                key={name}
                className="seam-cell p-5"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <Badge variant="outline" style={{ borderColor: palette.accent, color: palette.accent }}>
                  {leadStat(centroid)}-led
                </Badge>
                <h3 className="display mt-3 text-[17px]" style={{ color: palette.accent }}>
                  {name}
                </h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--muted)]">
                  {taglineFor(name)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="mx-auto max-w-[720px] px-6 pb-28 pt-4 text-center">
        <motion.h2
          className="display text-[clamp(32px,5vw,52px)] text-[var(--text)]"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          Your wallet already wrote this
        </motion.h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
          Nothing here is guessed. Paste an address and see what it forged.
        </p>
        <div className="mt-8">
          <AddressInput id="address-cta" examples={[]} />
        </div>
      </section>
    </main>
  );
}
