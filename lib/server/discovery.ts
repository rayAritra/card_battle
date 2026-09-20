import { db } from "@/lib/db/client";
import { log, errorMessage } from "@/lib/log";
import { isRecord } from "@/lib/chain/shared";
import { normalizeAddress } from "./card";
import type { Card } from "@/types";

/** How far either side of the challenger's level to look before giving up on a match. */
const LEVEL_WINDOW = 12;

/** Pool size pulled before choosing. Large enough to feel random, small enough to stay cheap. */
const POOL = 100;

export interface Opponent {
  address: string;
  ensName: string | null;
  archetype: string;
  level: number;
}

const toOpponent = (card: Card): Opponent => ({
  address: card.address,
  ensName: card.ensName,
  archetype: card.archetype,
  level: card.level,
});

/**
 * Picks a stored card to fight.
 *
 * Level-matched when `nearLevel` is given: a level 80 card fighting a level 14
 * card is a boring match, and the weighted round draw cannot rescue it. Falls
 * back to the full pool when the window is empty, so a young database still
 * returns someone.
 *
 * Wallets that set `noIndex` are excluded — the same flag that removes them
 * from the leaderboard removes them from discovery.
 *
 * Returns null rather than throwing when there is no database or no other
 * card yet; the caller shows "no opponents yet" instead of an error.
 */
export async function randomOpponent(
  exclude: string,
  nearLevel?: number,
): Promise<Opponent | null> {
  const client = db();
  if (!client) return null;

  const excluded = normalizeAddress(exclude);

  try {
    const { data, error } = await client
      .from("wallet_cards")
      .select("card")
      .eq("no_index", false)
      .neq("address", excluded)
      .limit(POOL);

    if (error) throw error;

    const cards = (data ?? [])
      .map((row) => row.card)
      .filter((card): card is Card => isRecord(card) && typeof card.address === "string")
      .filter((card) => normalizeAddress(card.address) !== excluded);

    if (cards.length === 0) return null;

    const matched =
      typeof nearLevel === "number"
        ? cards.filter((card) => Math.abs(card.level - nearLevel) <= LEVEL_WINDOW)
        : [];

    const pool = matched.length > 0 ? matched : cards;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    return chosen ? toOpponent(chosen) : null;
  } catch (error) {
    log("warn", "discovery.random", { exclude: excluded, error: errorMessage(error) });
    return null;
  }
}
