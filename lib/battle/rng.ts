import { keccak256, stringToHex } from "viem";

/**
 * Seeded randomness for battles.
 *
 * Nothing here may read the clock, the environment, or Math.random: a battle
 * must be reproducible from (addresses, date, nonce) alone, forever.
 */

export interface BattleRng {
  next: () => number;
  /** Integer in [min, max], inclusive. */
  int: (min: number, max: number) => number;
  /** Index into a weighted distribution. */
  weighted: (weights: number[]) => number;
}

/**
 * The battle seed.
 *
 * The two addresses are sorted lexicographically BEFORE hashing, so
 * battle(A, B) and battle(B, A) hash identically and the order of the
 * participants can never change the outcome.
 */
export function seedFromInputs(
  addrA: string,
  addrB: string,
  dateUtc: string,
  nonce = 0,
): `0x${string}` {
  const [first, second] = [addrA.toLowerCase(), addrB.toLowerCase()].sort();
  return keccak256(stringToHex(`${first}|${second}|${dateUtc}|${nonce}`));
}

/** The first 4 bytes of the seed, as an unsigned 32-bit integer. */
export function seedToInt(seed: string): number {
  return Number.parseInt(seed.slice(2, 10), 16) >>> 0;
}

/** mulberry32, seeded from the first 4 bytes of the keccak256 seed. */
export function createBattleRng(seed: string): BattleRng {
  let state = seedToInt(seed);

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };

  const int = (min: number, max: number): number =>
    min + Math.floor(next() * (max - min + 1));

  const weighted = (weights: number[]): number => {
    const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
    if (total <= 0) return 0;

    let roll = next() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= Math.max(0, weights[i]);
      if (roll < 0) return i;
    }
    return weights.length - 1;
  };

  return { next, int, weighted };
}
