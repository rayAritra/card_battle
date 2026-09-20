import type { Metadata } from "next";
import Link from "next/link";
import { ABILITIES } from "@/lib/stats/abilities";
import type { BattleEffect } from "@/types";

export const metadata: Metadata = {
  title: "Abilities",
  description:
    "Every ability a card can carry, what it does in battle, and how rare it is. A wallet is awarded the rarest one it qualifies for.",
  alternates: { canonical: "/abilities" },
};

const RARITY_LABELS: Record<number, string> = {
  5: "Mythic",
  4: "Legendary",
  3: "Epic",
  2: "Rare",
  1: "Common",
};

/**
 * Plain-English description of a battle effect.
 *
 * Written from the effect data rather than stored as prose so a new ability
 * cannot ship with a description that disagrees with what it actually does.
 */
function describeEffect(effect: BattleEffect): string {
  switch (effect.kind) {
    case "negateFirstLoss":
      return "Cancels the first round this card loses.";
    case "boostStat":
      return `Adds ${effect.amount ?? 0} to ${effect.stat ?? "a stat"} before every round.`;
    case "stealRound":
      return `Steals round ${effect.amount ?? 1} outright.`;
    case "doubleVariance":
      return "Doubles the swing on every roll, in both directions.";
    case "ignoreOpponentAbility":
      return "Suppresses the opponent's ability for the whole match.";
    case "rerollLowest":
      return "Rerolls this card's worst roll of the match.";
    default:
      return "Alters how rounds resolve.";
  }
}

/**
 * The ability compendium, rarest first.
 *
 * `assignAbility` awards the rarest ability a wallet qualifies for, so the
 * order here is the order that matters: the top of the page is what a card can
 * aspire to. Read from `ABILITIES` directly, so the list can never drift.
 */
export default function AbilitiesPage() {
  const tiers = [5, 4, 3, 2, 1];

  return (
    <main className="page">
      <header className="board-head">
        <p className="eyebrow">Compendium</p>
        <h1 className="board-head__title display">Abilities</h1>
        <p className="board-head__copy">
          {ABILITIES.length} abilities, each triggered by something the wallet actually did. A card
          is awarded the <strong>rarest</strong> one it qualifies for, and the same wallet always
          earns the same ability — ties break on a fixed order, never at random.
        </p>
      </header>

      {tiers.map((rarity) => {
        const tier = ABILITIES.filter((ability) => ability.rarity === rarity);
        if (tier.length === 0) return null;

        return (
          <section key={rarity} className="tier">
            <h2 className="tier__title">
              <span className={`tier__pip tier__pip--${rarity}`} aria-hidden="true" />
              {RARITY_LABELS[rarity] ?? `Tier ${rarity}`}
              <span className="tier__count mono">{tier.length}</span>
            </h2>

            <ul className="abilities">
              {tier.map((ability) => (
                <li key={ability.id} className="ability">
                  <h3 className="ability__name">{ability.name}</h3>
                  <p className="ability__effect">{describeEffect(ability.battleEffect)}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="compendium__foot">
        <Link className="button button--ghost" href="/archetypes">
          Browse archetypes
        </Link>
      </p>
    </main>
  );
}
