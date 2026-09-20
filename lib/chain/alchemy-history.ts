import type { ChainId } from "@/types";
import { alchemyRpcUrl } from "./alchemy";
import {
  MAX_HISTORY,
  isRecord,
  resilient,
  str,
  type RawNftTransfer,
  type RawTokenTransfer,
  type RawTx,
} from "./shared";

/**
 * Wallet history from Alchemy's `alchemy_getAssetTransfers`.
 *
 * This exists because Etherscan's free plan serves Ethereum only — a free key
 * asking for Base is refused outright (see CHAIN_UNSUPPORTED in ./etherscan).
 * Alchemy serves every chain the app's key has enabled, so it is the free path
 * to Base history.
 *
 * WHAT IS DIFFERENT FROM ETHERSCAN, and it matters:
 *
 * `getAssetTransfers` reports *transfers of value*, not *transactions*. There
 * is no calldata in the response, so a transfer-derived `RawTx` carries an
 * empty `input`. Two derived metrics therefore read low on a chain served this
 * way — open approvals, and unlabelled-contract exploration, both of which are
 * decoded from calldata. Neither is faked: an absent signal reads as zero
 * rather than as an invented number. Everything driven by transfers — trading,
 * tokens, holdings, NFTs, memecoin share, protocol touches — is fully present.
 */

/** Alchemy caps a single page at 1000; both directions are fetched separately. */
const PAGE = "0x3e8";

/** Per direction, per category. Two directions means up to 2000 rows per category. */
const MAX_PER_DIRECTION = 1000;

type Category = "external" | "erc20" | "erc721" | "erc1155";

interface Transfer {
  hash: string;
  from: string;
  to: string;
  /** Unix seconds, 0 when Alchemy omitted the metadata block. */
  timestamp: number;
  /** Raw integer value as a decimal string, matching Etherscan's `value`. */
  rawValue: string;
  contract: string;
  asset: string;
  decimals: string;
  tokenId: string;
  category: string;
}

const hexToDecimalString = (hex: string): string => {
  if (!/^0x[0-9a-fA-F]+$/.test(hex)) return "0";
  try {
    return BigInt(hex).toString(10);
  } catch {
    return "0";
  }
};

const isoToUnix = (iso: string): number => {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
};

export function toTransfer(row: Record<string, unknown>): Transfer {
  const rawContract = isRecord(row.rawContract) ? row.rawContract : {};
  const metadata = isRecord(row.metadata) ? row.metadata : {};

  return {
    hash: str(row.hash),
    from: str(row.from).toLowerCase(),
    to: str(row.to).toLowerCase(),
    timestamp: isoToUnix(str(metadata.blockTimestamp)),
    rawValue: hexToDecimalString(str(rawContract.value)),
    contract: str(rawContract.address).toLowerCase(),
    asset: str(row.asset),
    decimals: String(Number.parseInt(str(rawContract.decimal) || "0x12", 16) || 18),
    tokenId: str(row.tokenId) || str(row.erc721TokenId),
    category: str(row.category),
  };
}

/**
 * One direction of one category. Fails soft to [] like every other fetcher.
 *
 * Alchemy has no "from OR to" filter, so callers issue two calls and merge.
 */
async function page(
  address: string,
  chainId: ChainId,
  categories: Category[],
  direction: "from" | "to",
  order: "asc" | "desc",
): Promise<Transfer[]> {
  const url = alchemyRpcUrl(chainId);
  if (!url) return [];

  return resilient<Transfer[]>(
    `alchemy:transfers:${categories.join("+")}:${chainId}`,
    async () => {
      const params: Record<string, unknown> = {
        category: categories,
        withMetadata: true,
        excludeZeroValue: false,
        maxCount: PAGE,
        order,
      };
      params[direction === "from" ? "fromAddress" : "toAddress"] = address;

      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getAssetTransfers",
          params: [params],
        }),
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json: unknown = await response.json();
      if (!isRecord(json)) throw new Error("malformed response");

      // A JSON-RPC error body arrives with HTTP 200, so it has to be checked
      // explicitly or a disabled network would look like an empty wallet.
      if (isRecord(json.error)) throw new Error(str(json.error.message) || "rpc error");

      const result = isRecord(json.result) ? json.result : {};
      const transfers = Array.isArray(result.transfers) ? result.transfers : [];

      return transfers.filter(isRecord).slice(0, MAX_PER_DIRECTION).map(toTransfer);
    },
    [],
  );
}

/** Both directions of a category, newest first, capped at MAX_HISTORY. */
async function both(
  address: string,
  chainId: ChainId,
  categories: Category[],
): Promise<Transfer[]> {
  const [sent, received] = await Promise.all([
    page(address, chainId, categories, "from", "desc"),
    page(address, chainId, categories, "to", "desc"),
  ]);

  // A self-transfer appears in both directions; the hash plus the counterparty
  // and asset identifies a row well enough to drop the duplicate.
  const seen = new Set<string>();
  const merged: Transfer[] = [];

  for (const transfer of [...sent, ...received]) {
    const key = `${transfer.hash}:${transfer.from}:${transfer.to}:${transfer.contract}:${transfer.tokenId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(transfer);
  }

  return merged.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_HISTORY);
}

/**
 * Plain value transfers as `RawTx`.
 *
 * `input` is "0x" and `isError` is "0": Alchemy only reports transfers that
 * settled, so a reverted call never appears, and there is no calldata to
 * report. Both are honest absences rather than placeholders — see the note at
 * the top of this file for which metrics that affects.
 */
export async function getTransactions(address: string, chainId: ChainId): Promise<RawTx[]> {
  const transfers = await both(address, chainId, ["external"]);

  return transfers.map((transfer) => ({
    hash: transfer.hash,
    from: transfer.from,
    to: transfer.to,
    timeStamp: String(transfer.timestamp),
    input: "0x",
    value: transfer.rawValue,
    isError: "0",
    functionName: "",
  }));
}

export async function getTokenTransfers(
  address: string,
  chainId: ChainId,
): Promise<RawTokenTransfer[]> {
  const transfers = await both(address, chainId, ["erc20"]);

  return transfers.map((transfer) => ({
    hash: transfer.hash,
    from: transfer.from,
    to: transfer.to,
    timeStamp: String(transfer.timestamp),
    contractAddress: transfer.contract,
    tokenSymbol: transfer.asset,
    // Alchemy reports one name field; reusing it keeps the shape whole rather
    // than inventing a token name that was never returned.
    tokenName: transfer.asset,
    tokenDecimal: transfer.decimals,
    value: transfer.rawValue,
  }));
}

export async function getNftTransfers(
  address: string,
  chainId: ChainId,
): Promise<RawNftTransfer[]> {
  const transfers = await both(address, chainId, ["erc721", "erc1155"]);

  return transfers.map((transfer) => ({
    hash: transfer.hash,
    from: transfer.from,
    to: transfer.to,
    timeStamp: String(transfer.timestamp),
    contractAddress: transfer.contract,
    tokenName: transfer.asset,
    tokenID: transfer.tokenId,
  }));
}

/**
 * The wallet's earliest activity on this chain, unix seconds, 0 when unknown.
 *
 * Asks ascending across every category rather than external transfers alone:
 * a wallet bridged into Base and paid in USDC has token activity long before
 * it ever moves native ETH, and dating it from the first ETH movement would
 * make it look far younger than it is.
 */
export async function getFirstTxTimestamp(address: string, chainId: ChainId): Promise<number> {
  const categories: Category[] = ["external", "erc20", "erc721", "erc1155"];

  const [sent, received] = await Promise.all([
    page(address, chainId, categories, "from", "asc"),
    page(address, chainId, categories, "to", "asc"),
  ]);

  const stamps = [...sent, ...received].map((t) => t.timestamp).filter((ts) => ts > 0);

  return stamps.length > 0 ? Math.min(...stamps) : 0;
}
