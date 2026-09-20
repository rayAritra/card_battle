import protocolList from "@/data/protocols.json";
import tokenClasses from "@/data/token-classes.json";
import { getCached } from "@/lib/db/cache";
import { log } from "@/lib/log";
import {
  CHAIN_IDS,
  type ChainId,
  type Holding,
  type ProtocolCategory,
  type ProtocolEntry,
  type WalletProfile,
} from "@/types";
import { getBalances, type RawBalance } from "./alchemy";
import { resolveEns } from "./ens";
import {
  getFirstTxTimestamp,
  getNftTransfers,
  getTokenTransfers,
  getTransactions,
} from "./history";
import { getPrices, priceKey } from "./prices";
import { num, type RawNftTransfer, type RawTokenTransfer, type RawTx } from "./shared";

const DAY = 86_400;
const CACHE_TTL_HOURS = 24;

const ERC20_APPROVE = "0x095ea7b3";
const SET_APPROVAL_FOR_ALL = "0xa22cb465";

const PROTOCOLS = protocolList as ProtocolEntry[];

/** `${chainId}:${lowercased address}` -> protocol entry. */
const PROTOCOL_INDEX = new Map(
  PROTOCOLS.map((entry) => [`${entry.chainId}:${entry.address.toLowerCase()}`, entry]),
);

const MEME_SYMBOLS = new Set(tokenClasses.memecoins.map((symbol) => symbol.toUpperCase()));
const MEME_PATTERN = new RegExp(tokenClasses.memePattern, "i");

const isMemecoin = (symbol: string): boolean =>
  MEME_SYMBOLS.has(symbol.toUpperCase()) || MEME_PATTERN.test(symbol);

/** Categories we treat as leverage exposure for the RISK stat. */
const LEVERAGE_CATEGORIES = new Set<string>(["derivatives"]);

interface ChainSlice {
  chainId: ChainId;
  txs: RawTx[];
  tokens: RawTokenTransfer[];
  nfts: RawNftTransfer[];
  balances: RawBalance[];
  firstTxTimestamp: number;
}

/** A valid, attractive card must exist for a wallet with no history at all. */
export function emptyProfile(address: string, ensName: string | null = null): WalletProfile {
  return {
    address,
    ensName,
    chainsActive: [],
    firstTxTimestamp: 0,
    lastTxTimestamp: 0,
    walletAgeDays: 0,
    totalTxCount: 0,
    distinctActiveMonths: 0,
    txsPerActiveMonth: 0,
    swapCount: 0,
    uniqueTokensTraded: 0,
    dexProtocolsUsed: [],
    protocolsTouched: [],
    protocolCategories: [],
    deepestProtocolTxCount: 0,
    nftTxCount: 0,
    uniqueCollections: 0,
    currentHoldings: [],
    totalUsdValue: 0,
    holdingsCount: 0,
    longestContinuousHoldDays: 0,
    medianHoldDurationTop5Days: 0,
    pctPortfolioUntouched90d: 0,
    sellToBuyRatio: 0,
    memecoinVolumeShare: 0,
    leverageProtocolTxCount: 0,
    newContractInteractionCount: 0,
    openApprovalCount: 0,
  };
}

async function loadChain(address: string, chainId: ChainId): Promise<ChainSlice> {
  const cached = <T>(endpoint: string, fetcher: () => Promise<T>) =>
    getCached<T>({ address, chain: chainId, endpoint }, CACHE_TTL_HOURS, fetcher);

  const [txs, tokens, nfts, balances, firstTxTimestamp] = await Promise.all([
    cached("txlist", () => getTransactions(address, chainId)),
    cached("tokentx", () => getTokenTransfers(address, chainId)),
    cached("tokennfttx", () => getNftTransfers(address, chainId)),
    cached("balances", () => getBalances(address, chainId)),
    cached("firsttx", () => getFirstTxTimestamp(address, chainId)),
  ]);

  return { chainId, txs, tokens, nfts, balances, firstTxTimestamp };
}

/** Median of a numeric list. Returns 0 for an empty list. */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Counts ERC-20 allowances and operator approvals still open.
 *
 * Replays approve/setApprovalForAll calls oldest-first per (token, spender) pair
 * and keeps the pairs whose last write was non-zero / true.
 */
function countOpenApprovals(slices: ChainSlice[]): number {
  const latest = new Map<string, boolean>();

  const calls = slices
    .flatMap((slice) => slice.txs.map((tx) => ({ ...tx, chainId: slice.chainId })))
    .filter((tx) => tx.isError !== "1")
    .sort((a, b) => num(a.timeStamp) - num(b.timeStamp));

  for (const tx of calls) {
    const selector = tx.input.slice(0, 10).toLowerCase();
    if (selector !== ERC20_APPROVE && selector !== SET_APPROVAL_FOR_ALL) continue;

    const args = tx.input.slice(10);
    if (args.length < 128) continue;

    const spender = `0x${args.slice(24, 64)}`.toLowerCase();
    const value = args.slice(64, 128);
    const open = /[1-9a-f]/i.test(value); // non-zero amount, or `true` for setApprovalForAll

    latest.set(`${tx.chainId}:${tx.to}:${spender}`, open);
  }

  let open = 0;
  for (const isOpen of latest.values()) if (isOpen) open++;
  return open;
}

/**
 * Prices current balances and dates each position from its transfer history.
 *
 * `firstAcquiredTs` is the earliest inbound transfer of that token and
 * `lastMovedTs` the most recent transfer in either direction. Unpriced tokens
 * are kept with usdValue 0 so holdings counts stay honest.
 */
async function buildHoldings(wallet: string, slices: ChainSlice[]): Promise<Holding[]> {
  const requests = slices.flatMap((slice) =>
    slice.balances.map((balance) => ({ contract: balance.contract, chainId: slice.chainId })),
  );
  const prices = await getPrices(requests);

  const holdings: Holding[] = [];

  for (const slice of slices) {
    const inbound = new Map<string, number>();
    const moved = new Map<string, number>();

    for (const transfer of slice.tokens) {
      const ts = num(transfer.timeStamp);
      if (ts <= 0) continue;
      const contract = transfer.contractAddress;

      moved.set(contract, Math.max(moved.get(contract) ?? 0, ts));

      if (transfer.to === wallet && ts < (inbound.get(contract) ?? Infinity)) {
        inbound.set(contract, ts);
      }
    }

    for (const balance of slice.balances) {
      const price = prices[priceKey({ contract: balance.contract, chainId: slice.chainId })] ?? 0;
      holdings.push({
        symbol: balance.symbol,
        contract: balance.contract,
        usdValue: Number.isFinite(balance.amount * price) ? balance.amount * price : 0,
        firstAcquiredTs: inbound.get(balance.contract) ?? 0,
        lastMovedTs: moved.get(balance.contract) ?? 0,
      });
    }
  }

  return holdings.sort((a, b) => b.usdValue - a.usdValue);
}

/**
 * Fetches both chains in parallel and returns ONLY derived metrics.
 * No raw API payload may escape this function (ARCHITECTURE RULES, §3).
 */
export async function buildWalletProfile(address: string): Promise<WalletProfile> {
  const wallet = address.toLowerCase();
  const now = Math.floor(Date.now() / 1000);

  const [slices, ensName] = await Promise.all([
    Promise.all(CHAIN_IDS.map((chainId) => loadChain(wallet, chainId))),
    getCached<string | null>({ address: wallet, chain: 0, endpoint: "ens" }, CACHE_TTL_HOURS, () =>
      resolveEns(wallet),
    ),
  ]);

  const txs = slices.flatMap((slice) => slice.txs);
  const tokens = slices.flatMap((slice) => slice.tokens);
  const nfts = slices.flatMap((slice) => slice.nfts);

  if (txs.length === 0 && tokens.length === 0 && nfts.length === 0) {
    log("info", "profile.empty", { address: wallet });
    return emptyProfile(wallet, ensName);
  }

  // ── Activity timeline ────────────────────────────────────────────────────
  const timestamps = [...txs, ...tokens, ...nfts]
    .map((row) => num(row.timeStamp))
    .filter((ts) => ts > 0)
    .sort((a, b) => a - b);

  const knownFirst = slices.map((slice) => slice.firstTxTimestamp).filter((ts) => ts > 0);
  const firstTxTimestamp = Math.min(...[...knownFirst, ...timestamps.slice(0, 1)].filter(Boolean));
  const lastTxTimestamp = timestamps[timestamps.length - 1] ?? 0;

  const months = new Set(
    timestamps.map((ts) => new Date(ts * 1000).toISOString().slice(0, 7)),
  );

  // ── Protocol labelling ───────────────────────────────────────────────────
  const labelled = slices.flatMap((slice) =>
    slice.txs
      .map((tx) => PROTOCOL_INDEX.get(`${slice.chainId}:${tx.to}`))
      .filter((entry): entry is ProtocolEntry => entry !== undefined),
  );

  const txCountByProtocol = new Map<string, number>();
  for (const entry of labelled) {
    txCountByProtocol.set(entry.protocol, (txCountByProtocol.get(entry.protocol) ?? 0) + 1);
  }

  const dexEntries = labelled.filter((entry) => entry.category === "dex");
  const categories = [...new Set(labelled.map((entry) => entry.category))] as ProtocolCategory[];

  // Contract calls to addresses our label set does not know about.
  const unlabelled = new Set(
    slices.flatMap((slice) =>
      slice.txs
        .filter((tx) => tx.to !== "" && tx.input.length > 10)
        .filter((tx) => !PROTOCOL_INDEX.has(`${slice.chainId}:${tx.to}`))
        .map((tx) => `${slice.chainId}:${tx.to}`),
    ),
  );

  // ── Trading direction ────────────────────────────────────────────────────
  const buys = tokens.filter((transfer) => transfer.to === wallet).length;
  const sells = tokens.filter((transfer) => transfer.from === wallet).length;
  const memeTransfers = tokens.filter((transfer) => isMemecoin(transfer.tokenSymbol)).length;

  // ── Holdings ─────────────────────────────────────────────────────────────
  const currentHoldings = await buildHoldings(wallet, slices);
  const totalUsdValue = currentHoldings.reduce((sum, holding) => sum + holding.usdValue, 0);

  const holdDurations = currentHoldings
    .filter((holding) => holding.firstAcquiredTs > 0)
    .map((holding) => Math.max(0, (now - holding.firstAcquiredTs) / DAY));

  const topFiveDurations = currentHoldings
    .slice(0, 5)
    .filter((holding) => holding.firstAcquiredTs > 0)
    .map((holding) => Math.max(0, (now - holding.firstAcquiredTs) / DAY));

  const untouchedValue = currentHoldings
    .filter((holding) => holding.lastMovedTs > 0 && now - holding.lastMovedTs > 90 * DAY)
    .reduce((sum, holding) => sum + holding.usdValue, 0);

  return {
    address: wallet,
    ensName,
    chainsActive: slices
      .filter((slice) => slice.txs.length + slice.tokens.length + slice.nfts.length > 0)
      .map((slice) => slice.chainId),

    firstTxTimestamp: Number.isFinite(firstTxTimestamp) ? firstTxTimestamp : 0,
    lastTxTimestamp,
    walletAgeDays: firstTxTimestamp > 0 ? Math.floor((now - firstTxTimestamp) / DAY) : 0,
    totalTxCount: txs.length,
    distinctActiveMonths: months.size,
    txsPerActiveMonth: txs.length / Math.max(1, months.size),

    swapCount: dexEntries.length,
    uniqueTokensTraded: new Set(tokens.map((transfer) => transfer.contractAddress)).size,
    dexProtocolsUsed: [...new Set(dexEntries.map((entry) => entry.protocol))],

    protocolsTouched: [...txCountByProtocol.keys()],
    protocolCategories: categories,
    deepestProtocolTxCount: Math.max(0, ...txCountByProtocol.values()),

    nftTxCount: nfts.length,
    uniqueCollections: new Set(nfts.map((transfer) => transfer.contractAddress)).size,

    currentHoldings,
    totalUsdValue,
    holdingsCount: currentHoldings.length,

    longestContinuousHoldDays: Math.floor(Math.max(0, ...holdDurations)),
    medianHoldDurationTop5Days: Math.floor(median(topFiveDurations)),
    pctPortfolioUntouched90d: totalUsdValue > 0 ? untouchedValue / totalUsdValue : 0,
    sellToBuyRatio: sells / Math.max(1, buys),

    memecoinVolumeShare: tokens.length > 0 ? memeTransfers / tokens.length : 0,
    leverageProtocolTxCount: labelled.filter((entry) => LEVERAGE_CATEGORIES.has(entry.category))
      .length,
    newContractInteractionCount: unlabelled.size,
    openApprovalCount: countOpenApprovals(slices),
  };
}
