/** Ethereum mainnet and Base. The app supports these two chains only. */
export type ChainId = 1 | 8453;

export const CHAIN_IDS: readonly ChainId[] = [1, 8453] as const;

export const CHAIN_LABELS: Record<ChainId, string> = { 1: "ETH", 8453: "BASE" };

export type StatKey = "experience" | "trading" | "defi" | "holding" | "risk";

export const STAT_KEYS: readonly StatKey[] = [
  "experience",
  "trading",
  "defi",
  "holding",
  "risk",
] as const;

export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export type ProtocolCategory =
  | "dex"
  | "lending"
  | "staking"
  | "nft"
  | "bridge"
  | "derivatives"
  | "other";

export interface ProtocolEntry {
  address: string;
  chainId: number;
  protocol: string;
  category: string;
  riskWeight: number;
}

/** A token position currently held by the wallet, priced in USD. */
export interface Holding {
  symbol: string;
  contract: string;
  usdValue: number;
  /** Unix seconds of the earliest inbound transfer we can see. 0 when unknown. */
  firstAcquiredTs: number;
  /** Unix seconds of the most recent transfer in either direction. 0 when unknown. */
  lastMovedTs: number;
}

/**
 * Everything the stat engine is allowed to see. Purely derived metrics —
 * no raw API payloads may appear here (see ARCHITECTURE RULES).
 * All timestamps are unix seconds, UTC.
 */
export interface WalletProfile {
  address: string;
  ensName: string | null;
  chainsActive: ChainId[];

  firstTxTimestamp: number;
  lastTxTimestamp: number;
  walletAgeDays: number;
  totalTxCount: number;
  distinctActiveMonths: number;
  txsPerActiveMonth: number;

  swapCount: number;
  uniqueTokensTraded: number;
  dexProtocolsUsed: string[];

  protocolsTouched: string[];
  protocolCategories: ProtocolCategory[];
  deepestProtocolTxCount: number;

  nftTxCount: number;
  uniqueCollections: number;

  currentHoldings: Holding[];
  totalUsdValue: number;
  holdingsCount: number;

  longestContinuousHoldDays: number;
  medianHoldDurationTop5Days: number;
  pctPortfolioUntouched90d: number;
  sellToBuyRatio: number;

  memecoinVolumeShare: number;
  leverageProtocolTxCount: number;
  newContractInteractionCount: number;
  openApprovalCount: number;
}

export interface StatResult {
  /** Integer, 12..99. Never 0, never 100. */
  score: number;
  /** The raw composite before percentile mapping. Kept for debugging and baselines. */
  raw: number;
  /** 2-3 short human strings shown on hover/tap. */
  reasons: string[];
}

export type Stats = Record<StatKey, StatResult>;

export type BattleEffectKind =
  | "negateFirstLoss"
  | "boostStat"
  | "stealRound"
  | "doubleVariance"
  | "ignoreOpponentAbility"
  | "rerollLowest";

export interface BattleEffect {
  kind: BattleEffectKind;
  /** Which stat to boost, for kind "boostStat". */
  stat?: StatKey;
  /** Magnitude for boostStat, or the 1-in-N round index for stealRound. */
  amount?: number;
}

/** An ability as authored in lib/stats/abilities.ts. */
export interface AbilityDefinition {
  id: string;
  name: string;
  /** 1 (common) .. 5 (mythic). assignAbility picks the rarest qualifying one. */
  rarity: number;
  trigger: (profile: WalletProfile, stats: Stats) => boolean;
  battleEffect: BattleEffect;
  /** Template with {PLACEHOLDER} tokens filled by describeAbility. */
  flavorTemplate: string;
}

/** An ability as it appears on a finished card. */
export interface Ability {
  id: string;
  name: string;
  rarity: number;
  battleEffect: BattleEffect;
  /** The resolved, human-readable flavor line. */
  flavor: string;
}

export interface Card {
  address: string;
  ensName: string | null;
  chainsActive: ChainId[];
  archetype: string;
  level: number;
  rarity: Rarity;
  stats: Stats;
  ability: Ability;
  tagline: string;
  /** Always bucketed for display ("$28K"), never an exact figure. */
  netWorth: string;
  hideNetWorth?: boolean;
  /** Deterministic #0000-style serial derived from the address. */
  serial: string;
  computedAt: number;
}

export interface RoundLog {
  category: StatKey;
  statA: number;
  rollA: number;
  statB: number;
  rollB: number;
  /** Address of the round winner. */
  winner: string;
  abilitiesTriggered: string[];
}

export interface BattleResult {
  winner: string;
  loser: string;
  rounds: RoundLog[];
  /** Rounds won by the winner minus rounds won by the loser. */
  margin: number;
  seed: string;
  nonce: number;
  dateUtc: string;
}

export interface LeaderboardEntry {
  address: string;
  ensName: string | null;
  archetype: string;
  level: number;
  rarity: Rarity;
  wins: number;
  losses: number;
}
