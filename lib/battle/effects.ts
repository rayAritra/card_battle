import type { BattleEffect, Card, StatKey } from "@/types";

/**
 * Per-card mutable state for one battle. Everything an ability can spend is
 * tracked here so effects fire once and only once, identically every replay.
 */
export interface FighterState {
  card: Card;
  /** True while a negateFirstLoss ability still has its save available. */
  saveAvailable: boolean;
  /** True while a rerollLowest ability still has its reroll available. */
  rerollAvailable: boolean;
  /** Set when the opponent's ability is suppressed for the whole battle. */
  suppressed: boolean;
  roundsWon: number;
}

export const BASE_VARIANCE = 8;

export function createFighter(card: Card): FighterState {
  return {
    card,
    saveAvailable: card.ability.battleEffect.kind === "negateFirstLoss",
    rerollAvailable: card.ability.battleEffect.kind === "rerollLowest",
    suppressed: false,
    roundsWon: 0,
  };
}

/** The effect a fighter actually gets to use, accounting for suppression. */
export function activeEffect(fighter: FighterState): BattleEffect | null {
  return fighter.suppressed ? null : fighter.card.ability.battleEffect;
}

/**
 * Pre-round stat modifier: boostStat adds its amount when the round is played
 * on the boosted category.
 */
export function statBonus(fighter: FighterState, category: StatKey): number {
  const effect = activeEffect(fighter);
  if (!effect || effect.kind !== "boostStat") return 0;
  if (effect.stat !== category) return 0;
  return effect.amount ?? 0;
}

/** Roll variance for this fighter — doubled by doubleVariance. */
export function variance(fighter: FighterState): number {
  const effect = activeEffect(fighter);
  return effect?.kind === "doubleVariance" ? BASE_VARIANCE * 2 : BASE_VARIANCE;
}

/** Whether this fighter steals the given (1-indexed) round when it loses it. */
export function stealsRound(fighter: FighterState, roundNumber: number): boolean {
  const effect = activeEffect(fighter);
  if (!effect || effect.kind !== "stealRound") return false;

  const target = Math.max(1, Math.min(5, effect.amount ?? 1));
  return target === roundNumber;
}
