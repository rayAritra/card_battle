"use client";

import { AddressInput } from "@/components/AddressInput";
import { HeroWaterRipples } from "@/components/HeroWaterRipples";
import { RecentCards } from "@/components/RecentCards";
import { motion } from "framer-motion";
import { Hammer, ScanLine, Swords } from "lucide-react";
import Image from "next/image";
import styles from "./page.module.css";

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

const STAT_SECTIONS = [
  {
    value: "16",
    label: "archetypes to land on",
    title: "No two wallets forge the same card",
    body: "Every address is scored across five stats and matched against sixteen distinct archetypes — from DeFi warlords to genesis relics. Yours is decided by what you actually did onchain, not chosen.",
    image:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80",
    alt: "Abstract render of a voxel cube structure linked by glowing lines, suggesting a network of distinct nodes",
  },
  {
    value: "30",
    label: "abilities, rarest wins",
    title: "Rarity is earned, not rolled",
    body: "Thirty abilities are seeded straight from onchain behavior — the rarer the pattern behind a wallet, the rarer the ability it forges. Nothing here comes from a loot table.",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    alt: "Macro shot of a green circuit board",
  },
  {
    value: "5",
    label: "stats read from real activity",
    title: "Five numbers, one honest read",
    body: "Trades, holdings, protocol depth, risk and time onchain compress into five stats that describe how a wallet actually behaves — not how it wants to look.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    alt: "Analytics dashboard with charts displayed on a laptop screen",
  },
  {
    value: "2",
    label: "chains scanned per card",
    title: "Ethereum and Base, read together",
    body: "Every card pulls history from both chains at once, so a wallet's full footprint counts — not just whichever chain it happened to be scanned on.",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    alt: "Earth viewed from space at night, city lights connected by light",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
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
              <AddressInput ctaClassName={`button ${styles.heroCta}`} />
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
          <motion.h2
            className="display text-center text-[clamp(30px,4.5vw,48px)] text-(--text) mb-12"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            From address to arena
          </motion.h2>

          <motion.div
            className={`${styles.processGrid} mt-16`}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            transition={{
              duration: 0.9,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {STEPS.map((step) => {
              const Icon = step.icon;
              const cardBody = (
                <>
                  <span className={styles.stepCardIndex}>{step.n}</span>
                  <Icon
                    className={styles.stepCardIcon}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <h3 className="display mt-2 text-[23px] text-[var(--text)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">
                    {step.body}
                  </p>
                </>
              );
              return (
                <div
                  key={step.n}
                  className={styles.stepCardColumn}
                  style={{ "--accent": step.accent } as React.CSSProperties}
                >
                  <div className={styles.stepCard} tabIndex={0}>
                    {cardBody}
                  </div>
                  <div className={styles.stepCardReflection} aria-hidden="true">
                    <div className={styles.stepCard}>{cardBody}</div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </section>

        {/* ── Stats — real numbers, one alternating photo-led row per stat ── */}
        <section className="mx-auto max-w-[1120px] px-6 py-24">
          <motion.h2
            className="display text-left text-[clamp(30px,4.5vw,48px)] text-(--text)"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Built on real numbers
          </motion.h2>

          <div className="mt-16 flex flex-col gap-16">
            {STAT_SECTIONS.map((stat, index) => {
              const reversed = index % 2 === 1;
              return (
                <motion.div
                  key={stat.label}
                  className={`flex flex-col ${
                    reversed
                      ? "md:items-end md:text-right"
                      : "md:items-start md:text-left"
                  } items-center text-center`}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-80px" }}
                  variants={fadeUp}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="w-full md:max-w-[58%]">
                    <div className={styles.statPhoto}>
                      <Image
                        src={stat.image}
                        alt={stat.alt}
                        fill
                        sizes="(min-width: 768px) 38vw, 90vw"
                        className={styles.statPhotoImg}
                      />
                    </div>
                    <span className="display block mt-6 text-[clamp(34px,5vw,48px)] font-bold text-[var(--text)]">
                      {stat.value}
                    </span>
                    <span className="mono mt-1 block text-[12px] uppercase tracking-[0.08em] text-[var(--muted)]">
                      {stat.label}
                    </span>
                    <h3 className="display mt-5 text-[22px] text-[var(--text)]">
                      {stat.title}
                    </h3>
                    <p className="mt-3 text-[14px] leading-relaxed text-[var(--muted)]">
                      {stat.body}
                    </p>
                  </div>
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
