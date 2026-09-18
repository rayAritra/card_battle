import type { WalletProfile } from "@/types";
import { emptyProfile } from "@/lib/chain/normalize";

/**
 * Hand-written profiles covering the shapes that break stat engines:
 * an ancient whale, a churn machine, a nearly-new wallet, nothing at all,
 * a pure collector, and a wallet that only ever holds dollars.
 *
 * These are fixtures, not mocks of a live API — they never reach a network.
 */

const base = (address: string): WalletProfile => emptyProfile(address);

/** 2017-era whale: old, wide, patient, large. */
export const whale2017: WalletProfile = {
  ...base("0x1111111111111111111111111111111111170177"),
  ensName: "ancient.eth",
  chainsActive: [1, 8453],
  firstTxTimestamp: 1_492_000_000,
  lastTxTimestamp: 1_750_000_000,
  walletAgeDays: 3_100,
  totalTxCount: 2_400,
  distinctActiveMonths: 84,
  txsPerActiveMonth: 28.6,
  swapCount: 310,
  uniqueTokensTraded: 140,
  dexProtocolsUsed: ["Uniswap V2", "Uniswap V3", "Curve", "CoW Protocol"],
  protocolsTouched: [
    "Uniswap V3", "Aave V3", "Lido", "Curve", "EigenLayer", "Seaport",
    "Base Bridge", "Pendle", "MakerDAO", "Balancer V2",
  ],
  protocolCategories: ["dex", "lending", "staking", "nft", "bridge", "derivatives"],
  deepestProtocolTxCount: 420,
  nftTxCount: 180,
  uniqueCollections: 41,
  currentHoldings: [
    { symbol: "WETH", contract: "0xc02a", usdValue: 4_200_000, firstAcquiredTs: 1_500_000_000, lastMovedTs: 1_600_000_000 },
    { symbol: "wstETH", contract: "0x7f39", usdValue: 2_100_000, firstAcquiredTs: 1_620_000_000, lastMovedTs: 1_650_000_000 },
    { symbol: "USDC", contract: "0xa0b8", usdValue: 900_000, firstAcquiredTs: 1_640_000_000, lastMovedTs: 1_740_000_000 },
  ],
  totalUsdValue: 7_200_000,
  holdingsCount: 3,
  longestContinuousHoldDays: 2_400,
  medianHoldDurationTop5Days: 1_600,
  pctPortfolioUntouched90d: 0.87,
  sellToBuyRatio: 0.22,
  memecoinVolumeShare: 0.02,
  leverageProtocolTxCount: 18,
  newContractInteractionCount: 120,
  openApprovalCount: 64,
};

/** High-frequency trader: enormous churn, holds nothing. */
export const highFrequencyTrader: WalletProfile = {
  ...base("0x2222222222222222222222222222222222207a5f"),
  chainsActive: [1, 8453],
  firstTxTimestamp: 1_660_000_000,
  lastTxTimestamp: 1_755_000_000,
  walletAgeDays: 1_100,
  totalTxCount: 2_950,
  distinctActiveMonths: 34,
  txsPerActiveMonth: 86.8,
  swapCount: 1_400,
  uniqueTokensTraded: 320,
  dexProtocolsUsed: ["Uniswap V3", "1inch", "0x Protocol", "Aerodrome", "CoW Protocol"],
  protocolsTouched: ["Uniswap V3", "1inch", "0x Protocol", "Aerodrome", "dYdX v3"],
  protocolCategories: ["dex", "derivatives"],
  deepestProtocolTxCount: 900,
  nftTxCount: 4,
  uniqueCollections: 2,
  currentHoldings: [
    { symbol: "USDC", contract: "0xa0b8", usdValue: 48_000, firstAcquiredTs: 1_752_000_000, lastMovedTs: 1_755_000_000 },
  ],
  totalUsdValue: 48_000,
  holdingsCount: 1,
  longestContinuousHoldDays: 40,
  medianHoldDurationTop5Days: 12,
  pctPortfolioUntouched90d: 0,
  sellToBuyRatio: 0.98,
  memecoinVolumeShare: 0.41,
  leverageProtocolTxCount: 260,
  newContractInteractionCount: 340,
  openApprovalCount: 180,
};

/** Three transactions old. Must still produce a real, flattering-enough card. */
export const freshWallet: WalletProfile = {
  ...base("0x33333333333333333333333333333333330f7e51"),
  chainsActive: [8453],
  firstTxTimestamp: 1_752_000_000,
  lastTxTimestamp: 1_755_000_000,
  walletAgeDays: 34,
  totalTxCount: 3,
  distinctActiveMonths: 2,
  txsPerActiveMonth: 1.5,
  swapCount: 1,
  uniqueTokensTraded: 2,
  dexProtocolsUsed: ["Aerodrome"],
  protocolsTouched: ["Aerodrome"],
  protocolCategories: ["dex"],
  deepestProtocolTxCount: 1,
  nftTxCount: 0,
  uniqueCollections: 0,
  currentHoldings: [
    { symbol: "USDC", contract: "0x8335", usdValue: 240, firstAcquiredTs: 1_752_500_000, lastMovedTs: 1_752_500_000 },
  ],
  totalUsdValue: 240,
  holdingsCount: 1,
  longestContinuousHoldDays: 30,
  medianHoldDurationTop5Days: 30,
  pctPortfolioUntouched90d: 0,
  sellToBuyRatio: 0.5,
  memecoinVolumeShare: 0,
  leverageProtocolTxCount: 0,
  newContractInteractionCount: 1,
  openApprovalCount: 1,
};

/** No history whatsoever. Must be GHOST WALLET and must never throw. */
export const emptyWallet: WalletProfile = base("0x4444444444444444444444444444444444400000");

/** Collector: hundreds of NFT transfers, almost nothing else. */
export const nftOnlyWallet: WalletProfile = {
  ...base("0x5555555555555555555555555555555555501f70"),
  chainsActive: [1],
  firstTxTimestamp: 1_620_000_000,
  lastTxTimestamp: 1_753_000_000,
  walletAgeDays: 1_560,
  totalTxCount: 310,
  distinctActiveMonths: 38,
  txsPerActiveMonth: 8.2,
  swapCount: 6,
  uniqueTokensTraded: 4,
  dexProtocolsUsed: ["Uniswap V3"],
  protocolsTouched: ["Seaport", "Blur", "Uniswap V3"],
  protocolCategories: ["nft", "dex"],
  deepestProtocolTxCount: 210,
  nftTxCount: 640,
  uniqueCollections: 96,
  currentHoldings: [
    { symbol: "WETH", contract: "0xc02a", usdValue: 18_000, firstAcquiredTs: 1_700_000_000, lastMovedTs: 1_752_000_000 },
  ],
  totalUsdValue: 18_000,
  holdingsCount: 1,
  longestContinuousHoldDays: 620,
  medianHoldDurationTop5Days: 620,
  pctPortfolioUntouched90d: 0.1,
  sellToBuyRatio: 0.74,
  memecoinVolumeShare: 0,
  leverageProtocolTxCount: 0,
  newContractInteractionCount: 58,
  openApprovalCount: 37,
};

/** Only ever holds dollars. The STABLECOIN MONK shape. */
export const stablecoinOnlyWallet: WalletProfile = {
  ...base("0x66666666666666666666666666666666665ab1e0"),
  chainsActive: [1],
  firstTxTimestamp: 1_600_000_000,
  lastTxTimestamp: 1_754_000_000,
  walletAgeDays: 1_800,
  totalTxCount: 120,
  distinctActiveMonths: 40,
  txsPerActiveMonth: 3,
  swapCount: 12,
  uniqueTokensTraded: 3,
  dexProtocolsUsed: ["Curve"],
  protocolsTouched: ["Curve", "Aave V3", "MakerDAO"],
  protocolCategories: ["dex", "lending"],
  deepestProtocolTxCount: 44,
  nftTxCount: 0,
  uniqueCollections: 0,
  currentHoldings: [
    { symbol: "USDC", contract: "0xa0b8", usdValue: 310_000, firstAcquiredTs: 1_640_000_000, lastMovedTs: 1_700_000_000 },
    { symbol: "DAI", contract: "0x6b17", usdValue: 90_000, firstAcquiredTs: 1_650_000_000, lastMovedTs: 1_690_000_000 },
  ],
  totalUsdValue: 400_000,
  holdingsCount: 2,
  longestContinuousHoldDays: 1_300,
  medianHoldDurationTop5Days: 1_200,
  pctPortfolioUntouched90d: 1,
  sellToBuyRatio: 0.12,
  memecoinVolumeShare: 0,
  leverageProtocolTxCount: 0,
  newContractInteractionCount: 4,
  openApprovalCount: 6,
};

export const ALL_FIXTURES: Record<string, WalletProfile> = {
  whale2017,
  highFrequencyTrader,
  freshWallet,
  emptyWallet,
  nftOnlyWallet,
  stablecoinOnlyWallet,
};
