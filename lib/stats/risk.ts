import type { StatResult, WalletProfile } from "@/types";
import { formatCount, formatPercent } from "@/lib/utils/format";
import { fraction, saturate } from "./saturate";
import { statResult } from "./scoring";

const HALF_LEVERAGE_TXS = 15;
const HALF_NEW_CONTRACTS = 60;
const HALF_OPEN_APPROVALS = 30;

/**
 * RISK — appetite, NOT a warning.
 *
 * In battle this maps to damage variance: a high-RISK card swings harder in
 * both directions. Every reason string here is phrased as a property of the
 * wallet's play style, never as a judgment or a security warning.
 */
export function scoreRisk(profile: WalletProfile): StatResult {
  const memecoins = fraction(profile.memecoinVolumeShare);
  const leverage = saturate(profile.leverageProtocolTxCount, HALF_LEVERAGE_TXS);
  const frontier = saturate(profile.newContractInteractionCount, HALF_NEW_CONTRACTS);
  const approvals = saturate(profile.openApprovalCount, HALF_OPEN_APPROVALS);

  const raw = 0.3 * memecoins + 0.3 * leverage + 0.2 * frontier + 0.2 * approvals;

  const reasons: string[] = [];
  if (profile.memecoinVolumeShare > 0) {
    reasons.push(`${formatPercent(profile.memecoinVolumeShare)} of transfers in memecoins`);
  }
  if (profile.leverageProtocolTxCount > 0) {
    reasons.push(`${formatCount(profile.leverageProtocolTxCount)} derivatives interactions`);
  }
  if (profile.newContractInteractionCount > 0) {
    reasons.push(`${formatCount(profile.newContractInteractionCount)} unlabelled contracts explored`);
  }
  if (reasons.length === 0) reasons.push("Moves only on well-trodden ground");

  return statResult("risk", raw, reasons);
}
