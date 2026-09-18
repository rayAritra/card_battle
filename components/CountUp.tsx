"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  /** Seconds before counting starts. */
  delay?: number;
  duration?: number;
  className?: string;
  /** When false, renders the final value immediately. */
  animateOnMount?: boolean;
}

/**
 * Counts 0 -> value with an ease-out curve. Used for the LEVEL numeral and the
 * stat values, so the numbers land in sync with the bars filling.
 *
 * Respects prefers-reduced-motion by rendering the final value outright.
 */
export function CountUp({
  value,
  delay = 0,
  duration = 0.9,
  className,
  animateOnMount = true,
}: CountUpProps) {
  const reduced = useReducedMotion();
  const skip = reduced || !animateOnMount;
  const [display, setDisplay] = useState(skip ? value : 0);
  const latest = useRef(value);

  useEffect(() => {
    latest.current = value;

    if (skip) {
      setDisplay(value);
      return;
    }

    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (current) => setDisplay(Math.round(current)),
      onComplete: () => setDisplay(latest.current),
    });

    return () => controls.stop();
  }, [value, delay, duration, skip]);

  return (
    <span className={className} aria-label={String(value)}>
      {display}
    </span>
  );
}
