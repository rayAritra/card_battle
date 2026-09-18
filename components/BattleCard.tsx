"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { CHAIN_LABELS, STAT_KEYS, type Card } from "@/types";
import { cardArtDataUri } from "@/lib/art/generate";
import { paletteFor } from "@/lib/art/palettes";
import { truncateAddress } from "@/lib/utils/format";
import { AbilityBox } from "./AbilityBox";
import { CountUp } from "./CountUp";
import { HoloLayer } from "./HoloLayer";
import { RarityBadge } from "./RarityBadge";
import { StatBar } from "./StatBar";

interface BattleCardProps {
  card: Card;
  /** Drives the staged reveal in §9. False renders the finished card at rest. */
  animate?: boolean;
  /** Disables tilt/holo — used for the two cards inside a battle replay. */
  interactive?: boolean;
  /** Seconds added to every internal delay, so a replay can stagger two cards. */
  baseDelay?: number;
}

/** Stat rows start at 800ms and stagger 90ms apart (§9). */
const STATS_START = 0.8;
const STAT_STAGGER = 0.09;
const ABILITY_AT = 1.4;

/**
 * The card. Presentational only — every number arrives already computed.
 */
export function BattleCard({
  card,
  animate = true,
  interactive = true,
  baseDelay = 0,
}: BattleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const palette = paletteFor(card.archetype);
  const art = cardArtDataUri(card.address, palette, card.rarity);
  const identity = card.ensName ?? truncateAddress(card.address);
  const netWorth = card.hideNetWorth ? "???" : card.netWorth;

  return (
    <div
      ref={cardRef}
      className={`battle-card rarity--${card.rarity}`}
      style={
        {
          "--accent": palette.accent,
          "--accent-soft": palette.accentSoft,
          "--glow": palette.glow,
        } as React.CSSProperties
      }
    >
      <div className="battle-card__inner">
        <div className="card-head">
          <RarityBadge rarity={card.rarity} />
          <span className="chain-pips">
            {card.chainsActive.length > 0 ? (
              card.chainsActive.map((chain) => (
                <span className="chain-pip" key={chain}>
                  {CHAIN_LABELS[chain]}
                </span>
              ))
            ) : (
              <span className="chain-pip">NO CHAIN</span>
            )}
          </span>
          <span className="card-identity card-head__spacer" title={card.address}>
            {identity}
          </span>
        </div>

        <div
          className="card-art"
          style={{ backgroundImage: `url("${art}")` }}
          aria-hidden
        />

        <div className="card-body">
          <motion.h2
            className="card-archetype"
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: baseDelay + 0.5, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {card.archetype}
          </motion.h2>

          <motion.p
            className="card-tagline"
            initial={animate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: baseDelay + 0.6, duration: 0.3 }}
          >
            {card.tagline}
          </motion.p>

          <div className="card-vitals">
            <motion.div
              className="vital"
              initial={animate ? { opacity: 0, scale: 0.96 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: baseDelay + 0.65, duration: 0.4 }}
            >
              <span className="vital__label">Level</span>
              <span className="vital__value">
                <CountUp
                  value={card.level}
                  delay={baseDelay + 0.65}
                  duration={0.9}
                  animateOnMount={animate}
                />
              </span>
            </motion.div>

            <motion.div
              className="vital"
              initial={animate ? { opacity: 0, scale: 0.96 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: baseDelay + 0.7, duration: 0.4 }}
            >
              <span className="vital__label">Net worth</span>
              <span className="vital__value">{netWorth}</span>
            </motion.div>
          </div>

          <div className="stat-list">
            {STAT_KEYS.map((key, index) => (
              <StatBar
                key={key}
                name={key}
                stat={card.stats[key]}
                delay={baseDelay + STATS_START + index * STAT_STAGGER}
                animate={animate}
              />
            ))}
          </div>

          <motion.div
            initial={animate ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: baseDelay + ABILITY_AT, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <AbilityBox ability={card.ability} />
          </motion.div>

          <div className="card-foot">
            <span>Onchain Battle Cards</span>
            <span className="card-foot__serial">{card.serial}</span>
          </div>
        </div>
      </div>

      {interactive && <HoloLayer targetRef={cardRef} />}
    </div>
  );
}
