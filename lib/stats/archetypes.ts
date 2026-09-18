import tokenClasses from "@/data/token-classes.json";
import { STAT_KEYS, type Stats, type WalletProfile } from "@/types";
import { MAX_SCORE, MIN_SCORE } from "./scoring";

const STABLECOINS = new Set(tokenClasses.stablecoins.map((symbol) => symbol.toUpperCase()));

/**
 * 16 archetypes as centroids in 5-D normalized stat space, ordered
 * [experience, trading, defi, holding, risk].
 *
 * The ten named in the brief, plus six that fill otherwise unreachable regions:
 * very old and idle (GENESIS RELIC), new and passive (COLD VAULT), the true
 * median wallet (CHAIN TOURIST), trades size but avoids DeFi (SPOT
 * MAXIMALIST), holds volatile bags forever (BAGHOLDER SAINT), and veteran
 * high-churn risk (CYCLE VETERAN).
 */
export const ARCHETYPE_CENTROIDS: Record<string, readonly number[]> = {
  "GHOST WALLET": [0.06, 0.06, 0.06, 0.06, 0.06],
  "DEFI WARLORD": [0.72, 0.6, 0.97, 0.62, 0.6],
  "DIAMOND WHALE": [0.9, 0.35, 0.55, 0.97, 0.25],
  "STABLECOIN MONK": [0.65, 0.28, 0.62, 0.88, 0.1],
  "MEV GREMLIN": [0.68, 0.97, 0.7, 0.18, 0.92],
  "AIRDROP FARMER": [0.45, 0.72, 0.8, 0.25, 0.68],
  "SERIAL APER": [0.32, 0.88, 0.42, 0.18, 0.97],
  "LIQUIDITY SAGE": [0.85, 0.62, 0.92, 0.82, 0.32],
  "BRIDGE NOMAD": [0.55, 0.62, 0.68, 0.38, 0.55],
  "NFT WARLOCK": [0.58, 0.58, 0.3, 0.7, 0.68],
  "GENESIS RELIC": [0.95, 0.15, 0.12, 0.72, 0.1],
  "COLD VAULT": [0.18, 0.12, 0.12, 0.8, 0.1],
  "CHAIN TOURIST": [0.4, 0.4, 0.4, 0.4, 0.4],
  "SPOT MAXIMALIST": [0.8, 0.75, 0.25, 0.8, 0.28],
  "BAGHOLDER SAINT": [0.5, 0.45, 0.25, 0.88, 0.8],
  "CYCLE VETERAN": [0.92, 0.7, 0.6, 0.3, 0.72],
};

export const ARCHETYPE_NAMES = Object.keys(ARCHETYPE_CENTROIDS);

/** Maps a 12..99 score onto the 0..1 space the centroids live in. */
const normalize = (score: number): number =>
  Math.max(0, Math.min(1, (score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)));

/** Share of portfolio USD value sitting in stablecoins, 0 when unpriced. */
function stablecoinShare(profile: WalletProfile): number {
  if (profile.totalUsdValue <= 0) return 0;
  const stableValue = profile.currentHoldings
    .filter((holding) => STABLECOINS.has(holding.symbol.toUpperCase()))
    .reduce((sum, holding) => sum + holding.usdValue, 0);
  return stableValue / profile.totalUsdValue;
}

/**
 * Nearest centroid by euclidean distance, with three overrides.
 *
 * Two facts about a wallet are not represented on any of the five stat axes,
 * so they can never steer the geometry on their own: what it collects, and
 * what it holds. A wallet with no history is always GHOST WALLET, an
 * NFT-dominant wallet is NFT WARLOCK, and a portfolio that is essentially all
 * dollars is a STABLECOIN MONK regardless of its size.
 */
export function classifyArchetype(stats: Stats, profile: WalletProfile): string {
  const hasHistory =
    profile.totalTxCount > 0 || profile.nftTxCount > 0 || profile.uniqueTokensTraded > 0;
  if (!hasHistory) return "GHOST WALLET";

  const totalActivity = profile.totalTxCount + profile.nftTxCount;
  if (profile.nftTxCount >= 5 && profile.nftTxCount > totalActivity * 0.5) return "NFT WARLOCK";

  if (stablecoinShare(profile) > 0.85 && profile.holdingsCount > 0) return "STABLECOIN MONK";

  const point = STAT_KEYS.map((key) => normalize(stats[key].score));

  let best = ARCHETYPE_NAMES[0];
  let bestDistance = Infinity;

  for (const [name, centroid] of Object.entries(ARCHETYPE_CENTROIDS)) {
    // GHOST WALLET is reserved for the no-history case above, so that a quiet
    // but real wallet gets a more interesting card than "you have nothing".
    if (name === "GHOST WALLET") continue;

    let distance = 0;
    for (let i = 0; i < point.length; i++) distance += (centroid[i] - point[i]) ** 2;

    if (distance < bestDistance) {
      bestDistance = distance;
      best = name;
    }
  }

  return best;
}
