"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearRecents, readRecents, type RecentCard } from "@/lib/utils/recents";
import { truncateAddress } from "@/lib/utils/format";
import { paletteFor } from "@/lib/art/palettes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const initials = (card: RecentCard): string =>
  (card.name ?? card.address.slice(2)).slice(0, 2).toUpperCase();

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

      <ul className="seam-grid grid-cols-1 recents__list sm:grid-cols-2">
        {recents.map((card) => {
          const palette = paletteFor(card.archetype);

          return (
            <li key={card.address}>
              <Link className="seam-cell recents__row" href={`/card/${card.address}`}>
                <Avatar className="h-9 w-9" style={{ borderColor: palette.accent }}>
                  <AvatarFallback style={{ color: palette.accent }}>
                    {initials(card)}
                  </AvatarFallback>
                </Avatar>

                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="recents__name truncate">
                    {card.name ?? truncateAddress(card.address)}
                  </span>
                  <Badge
                    variant="outline"
                    className="w-fit border-[var(--line)] text-[8px] text-[#74748a]"
                  >
                    {card.archetype} · LVL {card.level}
                  </Badge>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
