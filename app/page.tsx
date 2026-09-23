"use client";

import { AddressInput } from "@/components/AddressInput";
import { HeroWaterRipples } from "@/components/HeroWaterRipples";
import { RecentCards } from "@/components/RecentCards";
import { Badge } from "@/components/ui/badge";
import { paletteFor } from "@/lib/art/palettes";
import { taglineFor } from "@/lib/flavor/templates";
import { ARCHETYPE_CENTROIDS } from "@/lib/stats/archetypes";
import { STAT_KEYS } from "@/types";
import { motion, type PanInfo } from "framer-motion";
import { Hammer, ScanLine, Swords } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import styles from "./page.module.css";

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
    icon: ScanLine,
    accent: "#6FD3FF",
  },
  {
    n: "02",
    title: "Forge",
    body: "Trades, holdings, protocol use and time onchain compress into five stats, an archetype, a rarity and an ability.",
    icon: Hammer,
    accent: "#E8C56A",
  },
  {
    n: "03",
    title: "Battle",
    body: "Five rounds, seeded from both addresses. Same match every time it's opened — nothing is rolled behind the scenes.",
    icon: Swords,
    accent: "#FF3B5C",
  },
];

/** Degrees each fanned card rotates from its neighbor, pivoting from a shared point at the bottom. */
const FAN_ANGLE = 27;

/** Horizontal drag (px) that steps the revealed card by one — keeps a swipe from
 * jumping straight from card 1 to card 3 over the hidden middle card. */
const SWIPE_STEP_PX = 70;

const METRICS = [
  { value: "16", label: "archetypes to land on" },
  { value: "30", label: "abilities, rarest wins" },
  { value: "5", label: "stats read from real activity" },
  { value: "2", label: "chains scanned per card" },
];

const FEATURED_ARCHETYPES = [
  "DEFI WARLORD",
  "DIAMOND WHALE",
  "MEV GREMLIN",
  "GENESIS RELIC",
];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  // Touch has no hover, so a swipe across the fan needs its own notion of
  // "revealed" card — driven by drag distance rather than raw pointer
  // position, so crossing the hidden middle card during a fast swipe still
  // lands on it instead of skipping straight to whatever's behind the cursor.
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const dragBaseCard = useRef(0);

  function handleFanDragStart() {
    dragBaseCard.current = activeCard ?? 0;
  }

  function handleFanDrag(
    _event: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo,
  ) {
    const steps = Math.round(info.offset.x / SWIPE_STEP_PX);
    const target = Math.min(
      STEPS.length - 1,
      Math.max(0, dragBaseCard.current + steps),
    );
    // Move at most one card per event, even when a single touchmove sample
    // covers a big jump — otherwise a fast swipe from card 1 to 3 can skip
    // right over card 2 without it ever becoming the active one.
    setActiveCard((current) => {
      const from = current ?? 0;
      if (target === from) return current;
      return from + Math.sign(target - from);
    });
  }

  return (
    <>
      <main className="relative">
        {/* ── Hero — rounded corner rectangle card with app bar page backdrop ── */}
        <section className="mx-auto w-full max-w-[1440px] px-3 sm:px-6 lg:px-8 pt-2 pb-14">
          <div className={styles.heroCard}>
            <div className={styles.heroArt} aria-hidden="true">
              <HeroWaterRipples />
            </div>

            <p className="enter enter-1 mono relative z-10 text-[13px] text-[var(--muted)]">
              Nothing to connect, nothing to sign — just an address
            </p>

            <h1
              className={`${styles.heroTitle} enter enter-2 relative z-10 mt-6`}
            >
              <span className="shimmer-text-graphite block text-[clamp(36px,7vw,72px)]">
                Every wallet
              </span>
              <span className="shimmer-text-graphite block text-[clamp(32px,6vw,64px)]">
                has a legend
              </span>
            </h1>

            <p className="enter enter-3 relative z-10 mx-auto mt-6 max-w-[560px] text-base leading-relaxed text-[var(--muted)]">
              Transform any wallet into a one-of-one battle card, shaped by its
              trades, holdings, protocols, risk and time onchain. Forge your
              identity, then put it to the test.
            </p>

            <div className="enter enter-4 relative z-10 mt-9 w-full">
              <AddressInput />
            </div>

            <motion.div
              aria-hidden
              className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
              animate={{ y: [0, 8, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span className="mono block text-[11px] text-[var(--muted)]">
                scroll
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                className="mx-auto mt-1 text-[var(--muted)]"
              >
                <path
                  d="M1 4l6 6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </motion.div>
          </div>
        </section>

        {/* ── Recently revealed — only renders once the visitor has a history ── */}
        <section className="mx-auto max-w-[1120px] px-6">
          <RecentCards />
        </section>

        {/* ── Process — a genuine sequence, so numbered blocks earn their place ── */}
        <section className="mx-auto max-w-[1120px] px-6 py-24">
          <motion.div
            className={styles.handFan}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0}
            dragMomentum={false}
            onDragStart={handleFanDragStart}
            onDrag={handleFanDrag}
            style={{ touchAction: "pan-y" }}
          >
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeCard === index;
              return (
                <div
                  key={step.n}
                  className={`${styles.fanCard}${isActive ? ` ${styles.fanCardActive}` : ""}`}
                  tabIndex={0}
                  onFocus={() => setActiveCard(index)}
                  onClick={() => setActiveCard(index)}
                  style={
                    {
                      "--rot": `${(index - 1) * FAN_ANGLE}deg`,
                      "--accent": step.accent,
                      zIndex: isActive ? 5 : STEPS.length - index,
                    } as React.CSSProperties
                  }
                >
                  <div className={styles.fanCardFace}>
                    <span className={styles.fanCardIndex}>{step.n}</span>
                    <Icon
                      className={styles.fanCardIcon}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <h3 className="display mt-2 text-[23px] text-[var(--text)]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">
                      {step.body}
                    </p>
                    <span
                      className={`${styles.fanCardIndex} ${styles.fanCardIndexBottom}`}
                    >
                      {step.n}
                    </span>
                  </div>
                </div>
              );
            })}
          </motion.div>

          <motion.h2
            className="display mt-24 text-center text-[clamp(30px,4.5vw,48px)] text-[var(--text)]"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            From address to arena
          </motion.h2>
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
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span className="block text-[clamp(34px,5vw,54px)] font-bold text-[var(--text)]">
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
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: palette.accent,
                      color: palette.accent,
                    }}
                  >
                    {leadStat(centroid)}-led
                  </Badge>
                  <h3
                    className="display mt-3 text-[17px]"
                    style={{ color: palette.accent }}
                  >
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
    </>
  );
}
