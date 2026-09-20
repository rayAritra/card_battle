"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readSelf } from "@/lib/utils/recents";

interface FightButtonProps {
  /** The wallet being challenged. */
  opponent: string;
}

/**
 * A one-tap challenge, when we know who the visitor is.
 *
 * Someone who has claimed a card gets a direct link to the match; everyone
 * else is sent to the opponent's card page, where the fight form lives. The
 * self address is read in an effect because the server cannot see
 * localStorage, and rendering it directly would mismatch on hydration.
 */
export function FightButton({ opponent }: FightButtonProps) {
  const [self, setSelf] = useState<string | null>(null);

  useEffect(() => {
    setSelf(readSelf());
  }, []);

  const target = self && self !== opponent.toLowerCase()
    ? `/battle/${self}/${opponent.toLowerCase()}`
    : `/card/${opponent.toLowerCase()}`;

  return (
    <Link className="board__fight" href={target}>
      Challenge
    </Link>
  );
}
