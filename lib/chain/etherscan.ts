import type { ChainId } from "@/types";
import {
  MAX_HISTORY,
  asRecords,
  num,
  resilient,
  str,
  type RawNftTransfer,
  type RawTokenTransfer,
  type RawTx,
} from "./shared";

const API = "https://api.etherscan.io/v2/api";

type Action = "txlist" | "tokentx" | "tokennfttx";

interface PageOptions {
  /** "desc" for the most recent N, "asc" for the oldest N. */
  sort?: "asc" | "desc";
  offset?: number;
}

/**
 * Etherscan Multichain V2: one key, one host, `chainid` selects the network.
 * Returns [] on any failure — including a missing key — so the card still renders.
 */
async function account(
  address: string,
  chainId: ChainId,
  action: Action,
  { sort = "desc", offset = MAX_HISTORY }: PageOptions = {},
): Promise<Record<string, unknown>[]> {
  const apikey = process.env.ETHERSCAN_API_KEY;
  if (!apikey) return [];

  return resilient(
    `etherscan:${action}:${chainId}`,
    async () => {
      const url = new URL(API);
      const params: Record<string, string> = {
        chainid: String(chainId),
        module: "account",
        action,
        address,
        startblock: "0",
        endblock: "99999999",
        page: "1",
        offset: String(offset),
        sort,
        apikey,
      };
      for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json: unknown = await response.json();
      const result = typeof json === "object" && json !== null ? (json as { result?: unknown; message?: unknown }) : {};

      // Etherscan answers "No transactions found" with status 0 and a string
      // result. That is an empty history, not an error — do not retry it.
      if (typeof result.result === "string") return [];

      return asRecords(result.result).slice(0, MAX_HISTORY);
    },
    [],
  );
}

export async function getTransactions(address: string, chainId: ChainId): Promise<RawTx[]> {
  const rows = await account(address, chainId, "txlist");
  return rows.map((row) => ({
    hash: str(row.hash),
    from: str(row.from).toLowerCase(),
    to: str(row.to).toLowerCase(),
    timeStamp: str(row.timeStamp),
    input: str(row.input),
    value: str(row.value),
    isError: str(row.isError),
    functionName: str(row.functionName),
  }));
}

export async function getTokenTransfers(
  address: string,
  chainId: ChainId,
): Promise<RawTokenTransfer[]> {
  const rows = await account(address, chainId, "tokentx");
  return rows.map((row) => ({
    hash: str(row.hash),
    from: str(row.from).toLowerCase(),
    to: str(row.to).toLowerCase(),
    timeStamp: str(row.timeStamp),
    contractAddress: str(row.contractAddress).toLowerCase(),
    tokenSymbol: str(row.tokenSymbol),
    tokenName: str(row.tokenName),
    tokenDecimal: str(row.tokenDecimal),
    value: str(row.value),
  }));
}

export async function getNftTransfers(
  address: string,
  chainId: ChainId,
): Promise<RawNftTransfer[]> {
  const rows = await account(address, chainId, "tokennfttx");
  return rows.map((row) => ({
    hash: str(row.hash),
    from: str(row.from).toLowerCase(),
    to: str(row.to).toLowerCase(),
    timeStamp: str(row.timeStamp),
    contractAddress: str(row.contractAddress).toLowerCase(),
    tokenName: str(row.tokenName),
    tokenID: str(row.tokenID),
  }));
}

/**
 * The wallet's first transaction timestamp, unix seconds, 0 when unknown.
 *
 * The main history pull takes the 3000 MOST RECENT txs, which would make an
 * old, busy wallet look young. This one-row ascending page recovers the true
 * origin date for a negligible extra call.
 */
export async function getFirstTxTimestamp(address: string, chainId: ChainId): Promise<number> {
  const rows = await account(address, chainId, "txlist", { sort: "asc", offset: 1 });
  return rows.length > 0 ? num(rows[0].timeStamp) : 0;
}
