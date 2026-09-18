import { STAT_KEYS, type Rarity, type Stats } from "@/types";

/**
 * Rarity is driven by LEVEL, with a peak-stat bonus so that a specialist —
 * a wallet that is extraordinary on one axis and ordinary elsewhere — can
 * still pull a high tier. Without the bonus only generalists ever go mythic.
 */
export function computeRarity(level: number, stats: Stats): Rarity {
  const peak = Math.max(...STAT_KEYS.map((key) => stats[key].score));

  let effective = level;
  if (peak >= 97) effective += 8;
  else if (peak >= 92) effective += 5;
  else if (peak >= 85) effective += 2;

  if (effective >= 92) return "mythic";
  if (effective >= 80) return "legendary";
  if (effective >= 64) return "epic";
  if (effective >= 42) return "rare";
  return "common";
}

/** Ordering used for sorting and for escalating visual treatment. */
export const RARITY_ORDER: Record<Rarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
  mythic: 4,
};
