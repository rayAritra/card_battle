import type { StatResult, WalletProfile } from "@/types";
import { formatCount } from "@/lib/utils/format";
import { saturate } from "./saturate";
import { statResult } from "./scoring";

const HALF_SWAPS = 120;
const HALF_UNIQUE_TOKENS = 40;
const HALF_CADENCE = 25;
const HALF_DEX_COUNT = 4;

/**
 * TRADING — throughput and breadth at the exchange layer.
 * Swap volume, how many different tokens, cadence per active month,
 * and how many venues the wallet is comfortable on.
 */
export function scoreTrading(profile: WalletProfile): StatResult {
  const swaps = saturate(profile.swapCount, HALF_SWAPS);
  const tokens = saturate(profile.uniqueTokensTraded, HALF_UNIQUE_TOKENS);
  const cadence = saturate(profile.txsPerActiveMonth, HALF_CADENCE);
  const venues = saturate(profile.dexProtocolsUsed.length, HALF_DEX_COUNT);

  const raw = 0.35 * swaps + 0.25 * tokens + 0.2 * cadence + 0.2 * venues;

  const reasons: string[] = [];
  if (profile.swapCount > 0) reasons.push(`${formatCount(profile.swapCount)} swaps routed`);
  if (profile.uniqueTokensTraded > 0) {
    reasons.push(`${formatCount(profile.uniqueTokensTraded)} distinct tokens touched`);
  }
  if (profile.dexProtocolsUsed.length > 0) {
    reasons.push(`Trades on ${profile.dexProtocolsUsed.slice(0, 3).join(", ")}`);
  } else if (profile.txsPerActiveMonth > 0) {
    reasons.push(`${formatCount(profile.txsPerActiveMonth)} transactions per active month`);
  }
  if (reasons.length === 0) reasons.push("No exchange activity detected");

  return statResult("trading", raw, reasons);
}
