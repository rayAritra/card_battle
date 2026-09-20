import { db } from "@/lib/db/client";
import { log, errorMessage } from "@/lib/log";
import { normalizeAddress } from "./card";

const RECENT_LIMIT = 50;

/** One resolved match as the history page shows it, from the viewer's side. */
export interface HistoryEntry {
  /** The other wallet in the match. */
  opponent: string;
  won: boolean;
  /** Rounds won by the viewer, out of the rounds played. */
  roundsWon: number;
  roundsPlayed: number;
  dateUtc: string;
  nonce: number;
}

export interface WalletRecord {
  wins: number;
  losses: number;
  entries: HistoryEntry[];
}

export interface HeadToHead {
  wins: number;
  losses: number;
  total: number;
}

const EMPTY_RECORD: WalletRecord = { wins: 0, losses: 0, entries: [] };

interface BattleRow {
  addr_a: string;
  addr_b: string;
  date_utc: string;
  nonce: number;
  winner: string;
  loser: string;
  result: unknown;
}

/**
 * Rounds won by `address` in a stored match.
 *
 * Derived from the round log rather than from `margin`, because margin is
 * signed from the winner's side and says nothing about who the viewer is.
 * A malformed or missing log degrades to 0 rather than throwing — the row
 * still counts toward the win/loss record either way.
 */
export function roundsWonBy(result: unknown, address: string): { won: number; played: number } {
  if (!result || typeof result !== "object" || !("rounds" in result)) {
    return { won: 0, played: 0 };
  }

  const rounds = (result as { rounds?: unknown }).rounds;
  if (!Array.isArray(rounds)) return { won: 0, played: 0 };

  let won = 0;
  for (const round of rounds) {
    if (
      round &&
      typeof round === "object" &&
      "winner" in round &&
      typeof (round as { winner: unknown }).winner === "string" &&
      normalizeAddress((round as { winner: string }).winner) === address
    ) {
      won += 1;
    }
  }

  return { won, played: rounds.length };
}

/**
 * Every match a wallet has fought, most recent first.
 *
 * Both sides of the table are queried because a wallet can appear as either
 * `addr_a` or `addr_b` — the engine sorts addresses before seeding, so which
 * column a wallet lands in is not something the caller controls.
 */
export async function walletHistory(address: string): Promise<WalletRecord> {
  const client = db();
  if (!client) return EMPTY_RECORD;

  const wallet = normalizeAddress(address);

  try {
    const { data, error } = await client
      .from("battles")
      .select("addr_a, addr_b, date_utc, nonce, winner, loser, result")
      .or(`addr_a.eq.${wallet},addr_b.eq.${wallet}`)
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT);

    if (error) throw error;

    let wins = 0;
    let losses = 0;

    const entries = (data ?? []).map((raw) => {
      const row = raw as BattleRow;
      const a = normalizeAddress(row.addr_a);
      const b = normalizeAddress(row.addr_b);
      const opponent = a === wallet ? b : a;
      const won = normalizeAddress(row.winner) === wallet;

      if (won) wins += 1;
      else losses += 1;

      const { won: roundsWon, played } = roundsWonBy(row.result, wallet);

      return {
        opponent,
        won,
        roundsWon,
        roundsPlayed: played,
        dateUtc: row.date_utc,
        nonce: row.nonce,
      } satisfies HistoryEntry;
    });

    return { wins, losses, entries };
  } catch (error) {
    log("warn", "history.wallet", { address: wallet, error: errorMessage(error) });
    return EMPTY_RECORD;
  }
}

/**
 * The record between two specific wallets, from `a`'s side.
 *
 * Counted across every nonce and every date, so a rematch streak shows up.
 */
export async function headToHead(a: string, b: string): Promise<HeadToHead> {
  const client = db();
  if (!client) return { wins: 0, losses: 0, total: 0 };

  const left = normalizeAddress(a);
  const right = normalizeAddress(b);

  try {
    const { data, error } = await client
      .from("battles")
      .select("winner")
      .or(
        `and(addr_a.eq.${left},addr_b.eq.${right}),and(addr_a.eq.${right},addr_b.eq.${left})`,
      )
      .limit(500);

    if (error) throw error;

    let wins = 0;
    let losses = 0;

    for (const row of data ?? []) {
      const winner = typeof row.winner === "string" ? normalizeAddress(row.winner) : null;
      if (winner === left) wins += 1;
      else if (winner === right) losses += 1;
    }

    return { wins, losses, total: wins + losses };
  } catch (error) {
    log("warn", "history.headToHead", { a: left, b: right, error: errorMessage(error) });
    return { wins: 0, losses: 0, total: 0 };
  }
}
