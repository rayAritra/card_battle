"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeftRight, Flame, History, Layers, Lock } from "lucide-react";
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

const PREMIUM_STAT_NAMES: Record<StatKey, string> = {
  experience: "legacy",
  trading: "velocity",
  defi: "protocol",
  holding: "conviction",
  risk: "volatility",
};

/** Same icon a visitor already met on /archetypes for this stat — not a second vocabulary. */
const STAT_ICONS: Record<StatKey, React.ComponentType<{ className?: string }>> = {
  experience: History,
  trading: ArrowLeftRight,
  defi: Layers,
  holding: Lock,
  risk: Flame,
};

/**
 * One stat box: icon, label, meter, value.
 *
 * The meter is a single continuous scaleX fill (so the spring animation and
 * count-up land together, as before) with a repeating-gradient mask laid over
 * it to read as discrete notches — a power-meter look without touching the
 * fill's own physics.
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
  const Icon = STAT_ICONS[name];

  return (
    <div
      className={`stat-box${open ? " stat-box--open" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="stat-box__trigger"
        aria-expanded={open}
        onClick={() => setPinned((value) => !value)}
      >
        <span className="stat-box__icon" aria-hidden>
          <Icon />
        </span>

        <span className="stat-box__body">
          <span className="stat-box__top">
            <span className="stat-box__name">{PREMIUM_STAT_NAMES[name]}</span>
            <CountUp
              className="stat-box__value mono"
              value={stat.score}
              delay={delay}
              duration={0.6}
              animateOnMount={animate}
            />
          </span>

          <span className="stat-box__track">
            <motion.span
              className="stat-box__fill"
              initial={animate && !reduced ? { scaleX: 0 } : false}
              animate={{ scaleX: fillTo }}
              transition={
                reduced
                  ? { duration: 0.12 }
                  : { type: "spring", stiffness: 90, damping: 18, delay, duration: 0.6 }
              }
            />
          </span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="stat-box__reasons"
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
