import type { Ability, AbilityDefinition, Stats, WalletProfile } from "@/types";
import { bucketNetWorth, formatCount, formatDays, formatPercent } from "@/lib/utils/format";

/**
 * 30 abilities, rarity 1 (everyone) to 5 (a handful of wallets on earth).
 *
 * `assignAbility` awards the RAREST qualifying ability, so the triggers read as
 * escalating claims about the wallet. `spark_of_the_chain` triggers
 * unconditionally, so no card is ever without one.
 */
export const ABILITIES: AbilityDefinition[] = [
  // ── Rarity 5 ──────────────────────────────────────────────────────────────
  {
    id: "genesis_flame",
    name: "GENESIS FLAME",
    rarity: 5,
    trigger: (p) => p.walletAgeDays > 2900 && p.totalTxCount > 500,
    battleEffect: { kind: "boostStat", stat: "experience", amount: 12 },
    flavorTemplate: "Burning since {AGE} before the current epoch.",
  },
  {
    id: "omnichain_sovereign",
    name: "OMNICHAIN SOVEREIGN",
    rarity: 5,
    trigger: (p) => p.chainsActive.length >= 2 && p.protocolCategories.length >= 6,
    battleEffect: { kind: "ignoreOpponentAbility" },
    flavorTemplate: "Holds ground across {CHAINS} chains and {CATEGORIES} categories.",
  },
  {
    id: "diamond_eternal",
    name: "DIAMOND ETERNAL",
    rarity: 5,
    trigger: (p) => p.longestContinuousHoldDays > 1460,
    battleEffect: { kind: "negateFirstLoss" },
    flavorTemplate: "Held {ASSET} for {DAYS} days without flinching.",
  },
  {
    id: "protocol_archon",
    name: "PROTOCOL ARCHON",
    rarity: 5,
    trigger: (p) => p.protocolsTouched.length >= 25,
    battleEffect: { kind: "stealRound", amount: 3 },
    flavorTemplate: "Commands {PROTOCOLS} protocols by name.",
  },
  {
    id: "deep_liquidity",
    name: "DEEP LIQUIDITY",
    rarity: 5,
    trigger: (p) => p.deepestProtocolTxCount >= 300,
    battleEffect: { kind: "boostStat", stat: "defi", amount: 12 },
    flavorTemplate: "{DEEPEST} transactions sunk into {TOP_PROTOCOL}.",
  },

  // ── Rarity 4 ──────────────────────────────────────────────────────────────
  {
    id: "diamond_hands",
    name: "DIAMOND HANDS",
    rarity: 4,
    trigger: (p) => p.longestContinuousHoldDays > 365,
    battleEffect: { kind: "negateFirstLoss" },
    flavorTemplate: "Held {ASSET} for {DAYS} days.",
  },
  {
    id: "category_polymath",
    name: "CATEGORY POLYMATH",
    rarity: 4,
    trigger: (p) => p.protocolCategories.length >= 5,
    battleEffect: { kind: "boostStat", stat: "defi", amount: 9 },
    flavorTemplate: "Fluent in {CATEGORIES} corners of the chain.",
  },
  {
    id: "veteran_of_cycles",
    name: "VETERAN OF CYCLES",
    rarity: 4,
    trigger: (p) => p.walletAgeDays > 1825,
    battleEffect: { kind: "boostStat", stat: "experience", amount: 9 },
    flavorTemplate: "{AGE} on chain, through every reversal.",
  },
  {
    id: "high_frequency",
    name: "HIGH FREQUENCY",
    rarity: 4,
    trigger: (p) => p.txsPerActiveMonth >= 80,
    battleEffect: { kind: "stealRound", amount: 4 },
    flavorTemplate: "{CADENCE} transactions in a single active month.",
  },
  {
    id: "leverage_adept",
    name: "LEVERAGE ADEPT",
    rarity: 4,
    trigger: (p) => p.leverageProtocolTxCount >= 25,
    battleEffect: { kind: "doubleVariance" },
    flavorTemplate: "{LEVERAGE} passes through the derivatives layer.",
  },
  {
    id: "collection_curator",
    name: "COLLECTION CURATOR",
    rarity: 4,
    trigger: (p) => p.uniqueCollections >= 30,
    battleEffect: { kind: "boostStat", stat: "holding", amount: 9 },
    flavorTemplate: "Keeper of {COLLECTIONS} distinct collections.",
  },
  {
    id: "bridge_sovereign",
    name: "BRIDGE SOVEREIGN",
    rarity: 4,
    trigger: (p) => p.chainsActive.length >= 2 && p.protocolCategories.includes("bridge"),
    battleEffect: { kind: "rerollLowest" },
    flavorTemplate: "Crosses between {CHAINS} chains as if they were one.",
  },

  // ── Rarity 3 ──────────────────────────────────────────────────────────────
  {
    id: "liquidity_router",
    name: "LIQUIDITY ROUTER",
    rarity: 3,
    trigger: (p) => p.swapCount >= 100,
    battleEffect: { kind: "boostStat", stat: "trading", amount: 8 },
    flavorTemplate: "{SWAPS} swaps routed through open water.",
  },
  {
    id: "staked_deep",
    name: "STAKED DEEP",
    rarity: 3,
    trigger: (p) => p.protocolCategories.includes("staking"),
    battleEffect: { kind: "boostStat", stat: "holding", amount: 8 },
    flavorTemplate: "Value pledged to the validator set.",
  },
  {
    id: "lending_operator",
    name: "LENDING OPERATOR",
    rarity: 3,
    trigger: (p) => p.protocolCategories.includes("lending"),
    battleEffect: { kind: "boostStat", stat: "defi", amount: 8 },
    flavorTemplate: "Runs positions through {TOP_PROTOCOL}.",
  },
  {
    id: "memecoin_alchemist",
    name: "MEMECOIN ALCHEMIST",
    rarity: 3,
    trigger: (p) => p.memecoinVolumeShare > 0.25,
    battleEffect: { kind: "doubleVariance" },
    flavorTemplate: "{MEME_PCT} of all flow in pure narrative.",
  },
  {
    id: "approval_keeper",
    name: "APPROVAL KEEPER",
    rarity: 3,
    trigger: (p) => p.openApprovalCount >= 25,
    battleEffect: { kind: "rerollLowest" },
    flavorTemplate: "{APPROVALS} allowances still standing open.",
  },
  {
    id: "token_polyglot",
    name: "TOKEN POLYGLOT",
    rarity: 3,
    trigger: (p) => p.uniqueTokensTraded >= 60,
    battleEffect: { kind: "boostStat", stat: "trading", amount: 8 },
    flavorTemplate: "Speaks {TOKENS} tokens without an accent.",
  },
  {
    id: "untouched_vault",
    name: "UNTOUCHED VAULT",
    rarity: 3,
    trigger: (p) => p.holdingsCount > 0 && p.pctPortfolioUntouched90d > 0.7,
    battleEffect: { kind: "negateFirstLoss" },
    flavorTemplate: "{UNTOUCHED_PCT} of the vault has not moved in a season.",
  },
  {
    id: "nft_conjurer",
    name: "NFT CONJURER",
    rarity: 3,
    trigger: (p) => p.nftTxCount >= 50,
    battleEffect: { kind: "stealRound", amount: 2 },
    flavorTemplate: "{NFTS} objects summoned and dismissed.",
  },
  {
    id: "frontier_walker",
    name: "FRONTIER WALKER",
    rarity: 3,
    trigger: (p) => p.newContractInteractionCount >= 80,
    battleEffect: { kind: "doubleVariance" },
    flavorTemplate: "{NEW_CONTRACTS} unnamed contracts answered the call.",
  },

  // ── Rarity 2 ──────────────────────────────────────────────────────────────
  {
    id: "multi_venue",
    name: "MULTI VENUE",
    rarity: 2,
    trigger: (p) => p.dexProtocolsUsed.length >= 3,
    battleEffect: { kind: "boostStat", stat: "trading", amount: 6 },
    flavorTemplate: "At home on {DEX}.",
  },
  {
    id: "patient_accumulator",
    name: "PATIENT ACCUMULATOR",
    rarity: 2,
    trigger: (p) => p.totalTxCount > 20 && p.sellToBuyRatio < 0.35,
    battleEffect: { kind: "boostStat", stat: "holding", amount: 6 },
    flavorTemplate: "Buys far more often than it lets go.",
  },
  {
    id: "base_native",
    name: "BASE NATIVE",
    rarity: 2,
    trigger: (p) => p.chainsActive.includes(8453),
    battleEffect: { kind: "boostStat", stat: "trading", amount: 6 },
    flavorTemplate: "Settled early on the newer ground.",
  },
  {
    id: "steady_hand",
    name: "STEADY HAND",
    rarity: 2,
    trigger: (p) => p.distinctActiveMonths >= 12,
    battleEffect: { kind: "boostStat", stat: "experience", amount: 6 },
    flavorTemplate: "Present in {MONTHS} separate months.",
  },
  {
    id: "portfolio_spread",
    name: "PORTFOLIO SPREAD",
    rarity: 2,
    trigger: (p) => p.holdingsCount >= 10,
    battleEffect: { kind: "rerollLowest" },
    flavorTemplate: "{HOLDINGS} positions held at once, worth {VALUE}.",
  },
  {
    id: "nft_dabbler",
    name: "NFT DABBLER",
    rarity: 2,
    trigger: (p) => p.nftTxCount >= 5,
    battleEffect: { kind: "boostStat", stat: "risk", amount: 6 },
    flavorTemplate: "{NFTS} objects passed through these hands.",
  },
  {
    id: "hundred_marks",
    name: "HUNDRED MARKS",
    rarity: 2,
    trigger: (p) => p.totalTxCount >= 100,
    battleEffect: { kind: "boostStat", stat: "experience", amount: 5 },
    flavorTemplate: "{TXS} marks left on the ledger.",
  },

  // ── Rarity 1 ──────────────────────────────────────────────────────────────
  {
    id: "ghost_protocol",
    name: "GHOST PROTOCOL",
    rarity: 1,
    trigger: (p) => p.totalTxCount === 0 && p.nftTxCount === 0,
    battleEffect: { kind: "doubleVariance" },
    flavorTemplate: "Unwritten, and therefore unpredictable.",
  },
  {
    id: "spark_of_the_chain",
    name: "SPARK OF THE CHAIN",
    rarity: 1,
    trigger: () => true,
    battleEffect: { kind: "boostStat", stat: "experience", amount: 4 },
    flavorTemplate: "Every address begins with a single signature.",
  },
];

/** The largest holding by USD value, used for {ASSET}. */
const topAsset = (profile: WalletProfile): string =>
  profile.currentHoldings[0]?.symbol ?? "the position";

const topProtocol = (profile: WalletProfile): string =>
  profile.protocolsTouched[0] ?? "the protocol";

/** Substitution dictionary shared by every flavorTemplate. */
function facts(profile: WalletProfile): Record<string, string> {
  return {
    AGE: formatDays(profile.walletAgeDays),
    DAYS: formatCount(profile.longestContinuousHoldDays),
    ASSET: topAsset(profile),
    TOP_PROTOCOL: topProtocol(profile),
    PROTOCOLS: formatCount(profile.protocolsTouched.length),
    CATEGORIES: formatCount(profile.protocolCategories.length),
    CHAINS: formatCount(profile.chainsActive.length),
    SWAPS: formatCount(profile.swapCount),
    TOKENS: formatCount(profile.uniqueTokensTraded),
    TXS: formatCount(profile.totalTxCount),
    MONTHS: formatCount(profile.distinctActiveMonths),
    CADENCE: formatCount(profile.txsPerActiveMonth),
    NFTS: formatCount(profile.nftTxCount),
    COLLECTIONS: formatCount(profile.uniqueCollections),
    HOLDINGS: formatCount(profile.holdingsCount),
    VALUE: bucketNetWorth(profile.totalUsdValue),
    APPROVALS: formatCount(profile.openApprovalCount),
    LEVERAGE: formatCount(profile.leverageProtocolTxCount),
    NEW_CONTRACTS: formatCount(profile.newContractInteractionCount),
    DEEPEST: formatCount(profile.deepestProtocolTxCount),
    DEX: profile.dexProtocolsUsed.slice(0, 3).join(", ") || "open venues",
    MEME_PCT: formatPercent(profile.memecoinVolumeShare),
    UNTOUCHED_PCT: formatPercent(profile.pctPortfolioUntouched90d),
  };
}

/** Fills {TOKEN} placeholders; an unknown placeholder is left verbatim. */
export function resolveFlavor(template: string, profile: WalletProfile): string {
  const dictionary = facts(profile);
  return template.replace(/\{([A-Z_]+)\}/g, (match, key: string) => dictionary[key] ?? match);
}

/**
 * The rarest qualifying ability. Ties break on id so the same wallet always
 * gets the same ability — cards must be reproducible.
 */
export function assignAbility(profile: WalletProfile, stats: Stats): Ability {
  const qualifying = ABILITIES.filter((ability) => ability.trigger(profile, stats));

  const chosen =
    qualifying.sort((a, b) => b.rarity - a.rarity || a.id.localeCompare(b.id))[0] ??
    ABILITIES[ABILITIES.length - 1];

  return {
    id: chosen.id,
    name: chosen.name,
    rarity: chosen.rarity,
    battleEffect: chosen.battleEffect,
    flavor: resolveFlavor(chosen.flavorTemplate, profile),
  };
}
