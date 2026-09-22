import { Circle, Crown, Gem, ShieldCheck, Star } from "lucide-react";
import type { Ability } from "@/types";
import "./AbilityBox.css";

/** Same shape ladder as the rarity gem (Circle..Crown) — the ability's own tier, index 0 = common. */
const PIP_ICONS = [Circle, ShieldCheck, Star, Gem, Crown];

/** Ability name, rarity pips, and the flavor line derived from real history. */
export function AbilityBox({ ability }: { ability: Ability }) {
  const PipIcon = PIP_ICONS[Math.min(Math.max(ability.rarity, 1), 5) - 1];

  return (
    <div className="ability">
      <div className="ability__ribbon">
        <span className="ability__ribbon-label">Signature ability</span>
        <span className="ability__pips" aria-label={`rarity ${ability.rarity} of 5`}>
          {Array.from({ length: 5 }, (_, index) => (
            <PipIcon
              key={index}
              className={`ability__pip${index < ability.rarity ? " ability__pip--on" : ""}`}
              aria-hidden
            />
          ))}
        </span>
      </div>
      <h3 className="ability__name">{ability.name}</h3>
      <p className="ability__flavor">{ability.flavor}</p>
    </div>
  );
}
