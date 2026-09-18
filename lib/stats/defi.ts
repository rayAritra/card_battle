import type { ProtocolCategory, StatResult, WalletProfile } from "@/types";
import { formatCount } from "@/lib/utils/format";
import { saturate } from "./saturate";
import { statResult } from "./scoring";

const HALF_PROTOCOL_COUNT = 8;
const HALF_DEPTH = 40;

/** Every category a wallet could plausibly reach. Coverage is measured against this. */
const ALL_CATEGORIES: ProtocolCategory[] = [
  "dex",
  "lending",
  "staking",
  "nft",
  "bridge",
  "derivatives",
  "other",
];

/**
 * DEFI — protocol breadth multiplied by category coverage.
 *
 * Coverage is a MULTIPLIER, not an addend: a wallet that has touched six
 * different categories must outscore one that has hammered a single protocol
 * forty times. `defi.test.ts` asserts exactly that.
 */
export function scoreDefi(profile: WalletProfile): StatResult {
  const breadth = saturate(profile.protocolsTouched.length, HALF_PROTOCOL_COUNT);
  const depth = saturate(profile.deepestProtocolTxCount, HALF_DEPTH);

  const categories = new Set(profile.protocolCategories);
  const coverage = categories.size / ALL_CATEGORIES.length;

  // Lending and staking are the load-bearing DeFi primitives; using either is
  // worth more than the same number of txs on a swap router.
  const primitives =
    ((categories.has("lending") ? 1 : 0) + (categories.has("staking") ? 1 : 0)) / 2;

  const base = 0.55 * breadth + 0.2 * depth + 0.25 * primitives;
  const raw = base * (0.45 + 0.55 * coverage);

  const reasons: string[] = [];
  if (profile.protocolsTouched.length > 0) {
    reasons.push(`${formatCount(profile.protocolsTouched.length)} protocols used`);
    reasons.push(
      `${categories.size} of ${ALL_CATEGORIES.length} categories covered`,
    );
  }
  if (profile.deepestProtocolTxCount > 0) {
    reasons.push(`Deepest position: ${formatCount(profile.deepestProtocolTxCount)} txs`);
  }
  if (reasons.length === 0) reasons.push("No labelled protocol activity");

  return statResult("defi", raw, reasons);
}
