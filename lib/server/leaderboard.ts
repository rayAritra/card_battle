import { db } from "@/lib/db/client";
import { log, errorMessage } from "@/lib/log";
import { isRecord } from "@/lib/chain/shared";
import type { Card, LeaderboardEntry } from "@/types";

const TOP_N = 25;

export interface Leaderboard {
  byLevel: LeaderboardEntry[];
  byRecord: LeaderboardEntry[];
}

const toEntry = (card: Card, wins = 0, losses = 0): LeaderboardEntry => ({
  address: card.address,
  ensName: card.ensName,
  archetype: card.archetype,
  level: card.level,
  rarity: card.rarity,
  wins,
  losses,
});

/**
 * Two rankings: highest LEVEL, and best win record.
 *
 * There is deliberately no net-worth ranking, and no toggle for one. Ranking
 * wallets by how much money they hold is the one thing this leaderboard will
 * not do.
 */
export async function loadLeaderboard(): Promise<Leaderboard> {
  const client = db();
  if (!client) return { byLevel: [], byRecord: [] };

  try {
    const [cardsResult, battlesResult] = await Promise.all([
      client.from("wallet_cards").select("card, no_index").eq("no_index", false).limit(500),
      client.from("battles").select("winner, loser").limit(5_000),
    ]);

    if (cardsResult.error) throw cardsResult.error;

    const cards = (cardsResult.data ?? [])
      .map((row) => row.card)
      .filter((card): card is Card => isRecord(card) && typeof card.address === "string");

    const visible = new Set(cards.map((card) => card.address));

    const wins = new Map<string, number>();
    const losses = new Map<string, number>();

    for (const row of battlesResult.data ?? []) {
      const winner = typeof row.winner === "string" ? row.winner : null;
      const loser = typeof row.loser === "string" ? row.loser : null;
      if (winner && visible.has(winner)) wins.set(winner, (wins.get(winner) ?? 0) + 1);
      if (loser && visible.has(loser)) losses.set(loser, (losses.get(loser) ?? 0) + 1);
    }

    const byLevel = [...cards]
      .sort((a, b) => b.level - a.level || a.address.localeCompare(b.address))
      .slice(0, TOP_N)
      .map((card) => toEntry(card, wins.get(card.address) ?? 0, losses.get(card.address) ?? 0));

    const byRecord = [...cards]
      .map((card) => toEntry(card, wins.get(card.address) ?? 0, losses.get(card.address) ?? 0))
      .filter((entry) => entry.wins + entry.losses > 0)
      .sort(
        (a, b) =>
          b.wins - a.wins ||
          a.losses - b.losses ||
          b.level - a.level ||
          a.address.localeCompare(b.address),
      )
      .slice(0, TOP_N);

    return { byLevel, byRecord };
  } catch (error) {
    log("warn", "leaderboard.load", { error: errorMessage(error) });
    return { byLevel: [], byRecord: [] };
  }
}
