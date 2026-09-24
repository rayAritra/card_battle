"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { StatKey, StatResult } from "@/types";
import { CountUp } from "./CountUp";
import "./StatBar.css";

interface StatBarProps {
  name: StatKey;
  stat: StatResult;
  /** Seconds to wait before this row fills, for the staggered reveal. */
  delay?: number;
  /** When false the bar renders filled with no entrance animation. */
  animate?: boolean;
}

const STAT_LABELS: Record<StatKey, string> = {
  experience: "Experience",
  trading: "Trading",
  defi: "DeFi",
  holding: "Holding",
  risk: "Risk",
};

/**
 * One stat row: label, a thin track, and the value — the plain ledger read
 * of the reference card rather than an icon-led power meter.
 *
 * Tapping or hovering expands the `reasons` — the strings that make the card
 * feel true rather than arbitrary — in 220ms.
 */
export function StatBar({ name, stat, delay = 0, animate = true }: StatBarProps) {
  const reduced = useReducedMotion();

  // Hover and tap are tracked separately. Sharing one flag means a pointer
  // user hovers (which opens the row) and then clicks — toggling it shut
  // again the instant they try to pin it open.
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;

  const fillTo = stat.score / 99;

  return (
    <div
      className={`stat-row${open ? " stat-row--open" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="stat-row__trigger"
        aria-expanded={open}
        onClick={() => setPinned((value) => !value)}
      >
        <span className="stat-row__name">{STAT_LABELS[name]}</span>

        <span className="stat-row__track">
          <motion.span
            className="stat-row__fill"
            initial={animate && !reduced ? { scaleX: 0 } : false}
            animate={{ scaleX: fillTo }}
            transition={
              reduced
                ? { duration: 0.12 }
                : { type: "spring", stiffness: 90, damping: 18, delay, duration: 0.6 }
            }
          />
        </span>

        <CountUp
          className="stat-row__value mono"
          value={stat.score}
          delay={delay}
          duration={0.6}
          animateOnMount={animate}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="stat-row__reasons"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <ul className="m-0 mt-0.5 mb-1.5 p-0">
              {stat.reasons.map((reason) => (
                <li className="list-none" key={reason}>
                  {reason}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
