import baseline from "./baseline.json";
import type { StatKey, StatResult } from "@/types";

export const MIN_SCORE = 12;
export const MAX_SCORE = 99;

/** Integers only, clamped 12..99. A card never shows 0 and never shows 100. */
export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return MIN_SCORE;
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(value)));
}

export type Baseline = Record<StatKey, number[]>;

/** Picked key-by-key so the documentation field in baseline.json stays out of the type. */
const BASELINE: Baseline = {
  experience: baseline.experience,
  trading: baseline.trading,
  defi: baseline.defi,
  holding: baseline.holding,
  risk: baseline.risk,
};

/**
 * Maps a raw composite onto 12..99 through a percentile table.
 *
 * Absolute thresholds always feel wrong ("is 40 swaps a lot?"); percentiles
 * always feel right. Each baseline array holds the raw value at the 0th, 10th,
 * ... 100th percentile of the reference population, and we interpolate between
 * the two bracketing points.
 */
export function percentileScore(key: StatKey, raw: number, table: Baseline = BASELINE): number {
  const points = table[key];
  if (!points || points.length < 2) return MIN_SCORE;
  if (Number.isNaN(raw)) return MIN_SCORE;
  if (raw === Number.POSITIVE_INFINITY) return MAX_SCORE;
  if (raw <= points[0]) return MIN_SCORE;

  const last = points.length - 1;
  if (raw >= points[last]) return MAX_SCORE;

  let upper = 1;
  while (upper < last && raw >= points[upper]) upper++;

  const lowerValue = points[upper - 1];
  const span = points[upper] - lowerValue;
  const withinBucket = span > 0 ? (raw - lowerValue) / span : 0;
  const percentile = (upper - 1 + withinBucket) / last;

  return clampScore(MIN_SCORE + percentile * (MAX_SCORE - MIN_SCORE));
}

/** Builds the StatResult a scorer returns. Reasons are capped at 3. */
export function statResult(key: StatKey, raw: number, reasons: string[]): StatResult {
  return {
    score: percentileScore(key, raw),
    raw: Number.isFinite(raw) ? Math.round(raw * 100) / 100 : 0,
    reasons: reasons.filter((reason) => reason.length > 0).slice(0, 3),
  };
}

/**
 * Recomputes the percentile table from a population of raw composites.
 *
 * Call with the `raw` values collected from real cards to replace the
 * hand-written baseline (see README, "Regenerating the baseline").
 */
export function recomputeBaselineFromRaw(rawByKey: Record<StatKey, number[]>): Baseline {
  const buckets = 10;
  const table = {} as Baseline;

  for (const key of Object.keys(rawByKey) as StatKey[]) {
    const sorted = [...rawByKey[key]].filter(Number.isFinite).sort((a, b) => a - b);
    if (sorted.length === 0) {
      table[key] = BASELINE[key];
      continue;
    }
    table[key] = Array.from({ length: buckets + 1 }, (_, i) => {
      const index = Math.min(sorted.length - 1, Math.round((i / buckets) * (sorted.length - 1)));
      return Math.round(sorted[index] * 100) / 100;
    });
  }

  return table;
}
