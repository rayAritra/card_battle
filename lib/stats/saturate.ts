/**
 * Saturating normalizer: maps 0..infinity onto 0..1 with no cliff.
 * `half` is the input value that scores 0.5, which is how each scorer
 * declares "this is a typical strong number for this signal".
 */
export function saturate(value: number, half: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value / (value + half);
}

/** Clamps a fraction that should already be 0..1 (shares, percentages). */
export function fraction(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(1, value);
}
