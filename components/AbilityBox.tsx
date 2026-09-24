import type { Ability } from "@/types";
import "./AbilityBox.css";

/** Ability name with its rarity pips, and the flavor line derived from real history. */
export function AbilityBox({ ability }: { ability: Ability }) {
  return (
    <div className="ability">
      <div className="ability__row">
        <h3 className="ability__name">{ability.name}</h3>
        <span className="ability__pips" aria-label={`rarity ${ability.rarity} of 5`}>
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={`ability__pip${index < ability.rarity ? " ability__pip--on" : ""}`}
              aria-hidden
            />
          ))}
        </span>
      </div>
      <p className="ability__flavor">{ability.flavor}</p>
    </div>
  );
}
