import { db } from "@/lib/db/client";
import { log, errorMessage } from "@/lib/log";
import type { BattleResult } from "@/types";

/**
 * Stores a resolved match so the leaderboard can count win records.
 *
 * Best effort: a battle is fully reproducible from (addresses, date, nonce),
 * so a failed write costs a leaderboard row, never the result itself.
 */
export async function persistBattle(
  result: BattleResult,
  addrA: string,
  addrB: string,
): Promise<void> {
  const client = db();
  if (!client) return;

  try {
    const { error } = await client.from("battles").upsert(
      {
        addr_a: addrA,
        addr_b: addrB,
        date_utc: result.dateUtc,
        nonce: result.nonce,
        winner: result.winner,
        loser: result.loser,
        result,
      },
      { onConflict: "addr_a,addr_b,date_utc,nonce" },
    );
    if (error) throw error;
  } catch (error) {
    log("warn", "battle.persist", { addrA, addrB, error: errorMessage(error) });
  }
}
