import { STAT_KEYS, type StatKey, type Stats } from "@/types";
import { MAX_SCORE, MIN_SCORE } from "./scoring";

/** EXPERIENCE carries 1.3x weight: time on chain is the spine of the level. */
const WEIGHTS: Record<StatKey, number> = {
  experience: 1.3,
  trading: 1,
  defi: 1,
  holding: 1,
  risk: 1,
};

/**
 * LEVEL, 1..99.
 *
 * The weighted mean of the five stats sits in 12..99; it is rescaled so the
 * floor of the stat range maps to level 1 and the ceiling to 99. That way a
 * wallet with nothing but a GHOST WALLET card still reads as level 1-ish
 * rather than a misleading level 12.
 */
export function computeLevel(stats: Stats): number {
  let weighted = 0;
  let totalWeight = 0;

  for (const key of STAT_KEYS) {
    weighted += stats[key].score * WEIGHTS[key];
    totalWeight += WEIGHTS[key];
  }

  const mean = weighted / totalWeight;
  const normalized = (mean - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
  const level = Math.round(1 + normalized * 98);

  return Math.max(1, Math.min(99, Number.isFinite(level) ? level : 1));
}
