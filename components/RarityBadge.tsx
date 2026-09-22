import type { Rarity } from "@/types";
import "./RarityBadge.css";

/** The tier label in the card's top-left corner. */
export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span className="rarity-badge" title={`${rarity} card`}>
      {rarity}
    </span>
  );
}
