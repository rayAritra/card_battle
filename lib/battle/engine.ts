import { STAT_KEYS, type BattleResult, type Card, type RoundLog, type StatKey } from "@/types";
import {
  activeEffect,
  createFighter,
  statBonus,
  stealsRound,
  variance,
  type FighterState,
} from "./effects";
import { createBattleRng, seedFromInputs } from "./rng";

export const ROUNDS = 5;

/** Baseline weight every category carries in the draw. */
const BASE_WEIGHT = 1;
/** Extra weight a category gets for each card that counts it among its top two. */
const TOP_STAT_WEIGHT = 1.5;

/**
 * Category draw weights.
 *
 * Each card's two best stats are more likely to come up, which is what creates
 * upsets: a card that is strong in one place gets to play there, and a card
 * with a higher total can still lose the categories that are drawn. A straight
 * stat-total comparison would be deterministic and boring.
 *
 * Both cards contribute symmetrically, so the weights do not depend on which
 * card was passed first.
 */
function categoryWeights(a: Card, b: Card): number[] {
  const weights = STAT_KEYS.map(() => BASE_WEIGHT);

  for (const card of [a, b]) {
    const ranked = [...STAT_KEYS]
      .sort((x, y) => card.stats[y].score - card.stats[x].score || x.localeCompare(y))
      .slice(0, 2);

    for (const key of ranked) weights[STAT_KEYS.indexOf(key)] += TOP_STAT_WEIGHT;
  }

  return weights;
}

interface RoundOutcome {
  log: RoundLog;
  winner: FighterState;
}

function playRound(
  roundNumber: number,
  category: StatKey,
  first: FighterState,
  second: FighterState,
  rng: ReturnType<typeof createBattleRng>,
): RoundOutcome {
  const triggered: string[] = [];

  // 1. Pre-round modifiers.
  const statA = first.card.stats[category].score + statBonus(first, category);
  const statB = second.card.stats[category].score + statBonus(second, category);

  if (statBonus(first, category) !== 0) triggered.push(first.card.ability.name);
  if (statBonus(second, category) !== 0) triggered.push(second.card.ability.name);

  // 2. Rolls. Draw both swings before any reroll so the stream stays stable.
  const varianceA = variance(first);
  const varianceB = variance(second);

  let swingA = rng.int(-varianceA, varianceA);
  let swingB = rng.int(-varianceB, varianceB);

  // 3. rerollLowest: spend the reroll on the first unfavourable swing.
  if (first.rerollAvailable && activeEffect(first)?.kind === "rerollLowest" && swingA < 0) {
    swingA = rng.int(-varianceA, varianceA);
    first.rerollAvailable = false;
    triggered.push(first.card.ability.name);
  }
  if (second.rerollAvailable && activeEffect(second)?.kind === "rerollLowest" && swingB < 0) {
    swingB = rng.int(-varianceB, varianceB);
    second.rerollAvailable = false;
    triggered.push(second.card.ability.name);
  }

  const rollA = statA + swingA;
  const rollB = statB + swingB;

  // 4. Decide the round. Ties fall to the higher level, then to the
  //    lexicographically first address — never to argument order.
  let winner: FighterState;
  if (rollA !== rollB) {
    winner = rollA > rollB ? first : second;
  } else if (first.card.level !== second.card.level) {
    winner = first.card.level > second.card.level ? first : second;
  } else {
    winner = first.card.address < second.card.address ? first : second;
  }

  let loser = winner === first ? second : first;

  // 5. Post-round effects, in a fixed order: steals resolve before saves, so a
  //    stolen round cannot also be saved.
  if (stealsRound(loser, roundNumber)) {
    triggered.push(loser.card.ability.name);
    [winner, loser] = [loser, winner];
  }

  if (loser.saveAvailable && activeEffect(loser)?.kind === "negateFirstLoss") {
    loser.saveAvailable = false;
    triggered.push(loser.card.ability.name);
    [winner, loser] = [loser, winner];
  }

  winner.roundsWon++;

  return {
    log: {
      category,
      statA,
      rollA,
      statB,
      rollB,
      winner: winner.card.address,
      abilitiesTriggered: [...new Set(triggered)],
    },
    winner,
  };
}

/**
 * Runs a battle.
 *
 * The two cards are canonicalized by address before anything else happens, so
 * battle(A, B) and battle(B, A) produce byte-identical results — including the
 * round log. `statA`/`rollA` in every RoundLog therefore refer to the
 * lexicographically FIRST address, not to the first argument.
 */
export function battle(cardA: Card, cardB: Card, dateUtc: string, nonce = 0): BattleResult {
  const [firstCard, secondCard] =
    cardA.address.toLowerCase() <= cardB.address.toLowerCase() ? [cardA, cardB] : [cardB, cardA];

  const seed = seedFromInputs(firstCard.address, secondCard.address, dateUtc, nonce);
  const rng = createBattleRng(seed);

  const first = createFighter(firstCard);
  const second = createFighter(secondCard);

  // ignoreOpponentAbility is resolved up front and symmetrically: if both
  // cards carry it, both are suppressed.
  if (firstCard.ability.battleEffect.kind === "ignoreOpponentAbility") second.suppressed = true;
  if (secondCard.ability.battleEffect.kind === "ignoreOpponentAbility") first.suppressed = true;

  const weights = categoryWeights(firstCard, secondCard);
  const rounds: RoundLog[] = [];

  for (let roundNumber = 1; roundNumber <= ROUNDS; roundNumber++) {
    const category = STAT_KEYS[rng.weighted(weights)];
    rounds.push(playRound(roundNumber, category, first, second, rng).log);
  }

  const winner = first.roundsWon >= second.roundsWon ? first : second;
  const loser = winner === first ? second : first;

  return {
    winner: winner.card.address,
    loser: loser.card.address,
    rounds,
    margin: winner.roundsWon - loser.roundsWon,
    seed,
    nonce,
    dateUtc,
  };
}
