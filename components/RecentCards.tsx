"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearRecents, readRecents, type RecentCard } from "@/lib/utils/recents";
import { truncateAddress } from "@/lib/utils/format";

/**
 * The visitor's recently viewed cards.
 *
 * Reads localStorage in an effect rather than during render: the server has no
 * storage to read, and rendering it directly would mismatch on hydration.
 * Renders nothing at all on a first visit, so the landing page stays clean.
 */
export function RecentCards() {
  const [recents, setRecents] = useState<RecentCard[]>([]);

  useEffect(() => {
    setRecents(readRecents());
  }, []);

  if (recents.length === 0) return null;

  return (
    <section className="recents">
      <div className="recents__head">
        <h2 className="recents__title">Recently revealed</h2>
        <button
          type="button"
          className="recents__clear"
          onClick={() => {
            clearRecents();
            setRecents([]);
          }}
        >
          Clear history
        </button>
      </div>

      <ul className="recents__list">
        {recents.map((card) => (
          <li key={card.address}>
            <Link className="recents__item" href={`/card/${card.address}`}>
              <span className="recents__name">{card.name ?? truncateAddress(card.address)}</span>
              <span className="recents__meta">
                {card.archetype} · LVL {card.level}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
