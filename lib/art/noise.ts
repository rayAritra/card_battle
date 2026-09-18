/**
 * Deterministic pseudo-randomness for card art.
 *
 * Seeded purely from the address, so the same wallet always produces
 * byte-identical artwork — on the server, in the browser, and in the OG image.
 * This is separate from lib/battle/rng.ts on purpose: battle outcomes must
 * never share a stream with decoration.
 */

/** FNV-1a over the address string. Cheap, stable, well-spread. */
export function seedFromAddress(address: string): number {
  let hash = 0x811c9dc5;
  const normalized = address.toLowerCase();

  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

export interface Rng {
  /** Next float in [0, 1). */
  next: () => number;
  /** Next float in [min, max). */
  range: (min: number, max: number) => number;
  /** Next integer in [min, max]. */
  int: (min: number, max: number) => number;
  /** Uniform pick from a non-empty list. */
  pick: <T>(items: readonly T[]) => T;
}

/** mulberry32 — small, fast, good enough for visual scatter. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };

  const range = (min: number, max: number): number => min + next() * (max - min);

  return {
    next,
    range,
    int: (min, max) => Math.floor(range(min, max + 1)),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
  };
}
