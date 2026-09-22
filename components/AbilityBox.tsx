import type { Ability } from "@/types";
import "./AbilityBox.css";

/** Ability name, rarity pips, and the flavor line derived from real history. */
export function AbilityBox({ ability }: { ability: Ability }) {
  return (
    <div className="ability">
      <div className="ability__head">
        <h3 className="ability__name">{ability.name}</h3>
        <span className="ability__pips" aria-label={`rarity ${ability.rarity} of 5`}>
          {"◆".repeat(ability.rarity)}
          <span style={{ opacity: 0.25 }}>{"◆".repeat(5 - ability.rarity)}</span>
        </span>
      </div>
      <p className="ability__flavor">{ability.flavor}</p>
    </div>
  );
}
