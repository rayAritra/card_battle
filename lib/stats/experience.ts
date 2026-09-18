import type { StatResult, WalletProfile } from "@/types";
import { formatCount, formatDays } from "@/lib/utils/format";
import { saturate } from "./saturate";
import { statResult } from "./scoring";

/** Input that scores 0.5 on each sub-signal — "a strong number, not a record". */
const HALF_AGE_DAYS = 900;
const HALF_ACTIVE_MONTHS = 18;
const HALF_TX_COUNT = 300;

/**
 * EXPERIENCE — time on chain, sustained across months, backed by volume.
 * 0.4 age + 0.4 active months + 0.2 transaction count.
 */
export function scoreExperience(profile: WalletProfile): StatResult {
  const age = saturate(profile.walletAgeDays, HALF_AGE_DAYS);
  const months = saturate(profile.distinctActiveMonths, HALF_ACTIVE_MONTHS);
  const volume = saturate(profile.totalTxCount, HALF_TX_COUNT);

  const raw = 0.4 * age + 0.4 * months + 0.2 * volume;

  const reasons: string[] = [];
  if (profile.walletAgeDays > 0) reasons.push(`Active for ${formatDays(profile.walletAgeDays)}`);
  else reasons.push("No transaction history on record");

  if (profile.distinctActiveMonths > 0) {
    reasons.push(`Present in ${formatCount(profile.distinctActiveMonths)} distinct months`);
  }
  if (profile.totalTxCount > 0) {
    reasons.push(`${formatCount(profile.totalTxCount)} transactions indexed`);
  }

  return statResult("experience", raw, reasons);
}
