import type { StatResult, WalletProfile } from "@/types";
import { formatDays, formatPercent } from "@/lib/utils/format";
import { fraction, saturate } from "./saturate";
import { statResult } from "./scoring";

const HALF_MEDIAN_HOLD_DAYS = 180;
const HALF_LONGEST_HOLD_DAYS = 500;

/**
 * HOLDING — conviction. How long the core positions have been held, how much
 * of the portfolio has sat untouched, and how rarely the wallet sells.
 */
export function scoreHolding(profile: WalletProfile): StatResult {
  const medianHold = saturate(profile.medianHoldDurationTop5Days, HALF_MEDIAN_HOLD_DAYS);
  const longestHold = saturate(profile.longestContinuousHoldDays, HALF_LONGEST_HOLD_DAYS);
  const untouched = fraction(profile.pctPortfolioUntouched90d);

  // A wallet that sells as often as it buys scores 0.5 here; one that only
  // accumulates approaches 1. A wallet that has never traded scores 0 — never
  // having sold is not conviction, and an empty wallet must not read as one.
  const hasPositions = profile.totalTxCount > 0 || profile.holdingsCount > 0;
  const restraint = hasPositions ? 1 / (1 + Math.max(0, profile.sellToBuyRatio)) : 0;

  const raw = 0.35 * medianHold + 0.25 * untouched + 0.2 * restraint + 0.2 * longestHold;

  const reasons: string[] = [];
  if (profile.medianHoldDurationTop5Days > 0) {
    reasons.push(`Top positions held ${formatDays(profile.medianHoldDurationTop5Days)}`);
  }
  if (profile.pctPortfolioUntouched90d > 0) {
    reasons.push(`${formatPercent(profile.pctPortfolioUntouched90d)} of value untouched for 90 days`);
  }
  if (profile.sellToBuyRatio > 0) {
    reasons.push(`Sells ${profile.sellToBuyRatio.toFixed(2)} times per buy`);
  }
  if (reasons.length === 0) reasons.push("No positions to hold");

  return statResult("holding", raw, reasons);
}
