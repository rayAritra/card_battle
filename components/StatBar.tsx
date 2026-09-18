"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { StatKey, StatResult } from "@/types";
import { CountUp } from "./CountUp";

interface StatBarProps {
  name: StatKey;
  stat: StatResult;
  /** Seconds to wait before this row fills, for the staggered reveal. */
  delay?: number;
  /** When false the bar renders filled with no entrance animation. */
  animate?: boolean;
}

/**
 * One stat row: label, fill, value.
 *
 * Tapping or hovering expands the `reasons` — the strings that make the card
 * feel true rather than arbitrary — in 220ms.
 */
export function StatBar({ name, stat, delay = 0, animate = true }: StatBarProps) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  const fillTo = stat.score / 99;

  return (
    <div
      className="stat-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="stat"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="stat__row">
          <span className="stat__name">{name}</span>

          <span className="stat__track">
            <motion.span
              className="stat__fill"
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
            className="stat__value mono"
            value={stat.score}
            delay={delay}
            duration={0.6}
            animateOnMount={animate}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="stat__reasons"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <ul>
              {stat.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
