import { Circle, Crown, Gem, ShieldCheck, Star } from "lucide-react";
import type { Rarity } from "@/types";
import "./RarityBadge.css";

/**
 * Same 5-tier icon scale as /abilities' rarity ladder (Circle..Crown), so a
 * card's own rarity reads as the same visual language a visitor already met
 * there — not a second icon vocabulary invented just for this badge.
 */
const RARITY_ICONS: Record<Rarity, React.ComponentType<{ className?: string }>> = {
  common: Circle,
  rare: ShieldCheck,
  epic: Star,
  legendary: Gem,
  mythic: Crown,
};

/** The tier gem in the card's top-left corner — shape and metal both carry the tier, never color alone. */
export function RarityBadge({ rarity }: { rarity: Rarity }) {
  const Icon = RARITY_ICONS[rarity];

  return (
    <span className="rarity-badge" title={`${rarity} card`}>
      <Icon className="rarity-badge__icon" aria-hidden />
      <span className="rarity-badge__label">{rarity}</span>
    </span>
  );
}
