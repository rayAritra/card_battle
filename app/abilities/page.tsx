import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { Badge } from "@/components/ui/badge";
import { ABILITIES } from "@/lib/stats/abilities";
import type { BattleEffect } from "@/types";
import { Circle, Crown, Gem, ShieldCheck, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "./abilities.module.css";

const RARITY_ICONS: Record<
  number,
  React.ComponentType<{ className?: string }>
> = {
  5: Crown,
  4: Gem,
  3: Star,
  2: ShieldCheck,
  1: Circle,
};

const RARITY_COLORS: Record<number, string> = {
  5: "#ff4fd8",
  4: "#ffb020",
  3: "#b45cff",
  2: "#2fe0d6",
  1: "#767676",
};

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
      <header className="mx-auto max-w-[620px] text-center">
        <h1 className="display enter enter-2 text-[clamp(38px,6.5vw,62px)] text-[var(--text)]">
          Abilities
        </h1>
        <p className="enter enter-3 mt-4 text-[14px] leading-relaxed text-[var(--muted)]">
          {ABILITIES.length} abilities, each triggered by something the wallet
          actually did. A card is awarded the{" "}
          <strong className="text-[var(--text)]">rarest</strong> one it
          qualifies for, and the same wallet always earns the same ability —
          ties break on a fixed order, never at random.
        </p>
      </header>

      {tiers.map((rarity) => {
        const tier = ABILITIES.filter((ability) => ability.rarity === rarity);
        if (tier.length === 0) return null;

        const TierIcon = RARITY_ICONS[rarity] ?? Circle;

        const isFive = tier.length === 5;
        const gridClass = isFive
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5"
          : tier.length === 2
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3.5"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5";

        return (
          <section key={rarity} className="mt-10">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span
                className={styles.tierHeadIcon}
                style={
                  {
                    "--tier-color": RARITY_COLORS[rarity] ?? "#545454",
                  } as React.CSSProperties
                }
                aria-hidden="true"
              >
                <TierIcon className="h-4 w-4" />
              </span>
              <h2 className="display text-[15px] font-semibold text-[var(--text)]">
                {RARITY_LABELS[rarity] ?? `Tier ${rarity}`}
              </h2>
              <Badge variant="secondary">{tier.length}</Badge>
            </div>

            <div className={gridClass}>
              {tier.map((ability, index) => {
                const Icon = RARITY_ICONS[rarity] ?? Circle;
                const color = RARITY_COLORS[rarity] ?? "#767676";
                const colSpanClass = isFive
                  ? index < 3
                    ? "sm:col-span-1 lg:col-span-2"
                    : index === 4
                      ? "sm:col-span-2 lg:col-span-3"
                      : "sm:col-span-1 lg:col-span-3"
                  : "";

                return (
                  <LiquidGlassCard
                    key={ability.id}
                    borderRadius={18}
                    tintOpacity={0.05}
                    interactive={true}
                    className={`${styles.abilityCard} stagger-item ${colSpanClass}`}
                    style={
                      {
                        "--accent": color,
                        "--i": index,
                      } as React.CSSProperties
                    }
                  >
                    <div className={styles.abilityCardInner}>
                      <span className={styles.abilityCardIcon}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <h3 className="display text-[13.5px] font-semibold text-[var(--text)]">
                        {ability.name}
                      </h3>
                      <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">
                        {describeEffect(ability.battleEffect)}
                      </p>
                    </div>
                  </LiquidGlassCard>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="mt-10 text-center">
        <Link className="button button--ghost" href="/archetypes">
          Browse archetypes
        </Link>
      </p>
    </main>
  );
}
