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

/**
 * Returned when Etherscan refuses a chain outright rather than reporting an
 * empty history.
 *
 * The V2 endpoint is multichain, but access to chains other than Ethereum is a
 * paid feature: a free key asking for Base gets `status: 0` with
 * "Free API access is not supported for this chain". That is a plan limit, not
 * a transient failure and not an empty wallet — retrying cannot fix it and
 * treating it as "no history" would silently halve the product. Callers check
 * for this and fall back to another source.
 */
export const CHAIN_UNSUPPORTED = Symbol("etherscan:chain-unsupported");

export type AccountRows = Record<string, unknown>[] | typeof CHAIN_UNSUPPORTED;

const REFUSAL = /not supported for this chain|upgrade your api plan/i;

/**
 * Etherscan reports throttling in the same place it reports an empty history:
 * `status: 0` with a string `result`. Matching it is not cosmetic — without
 * this check "Max rate limit reached" is read as "this wallet has no
 * transactions", which produces a plausible-looking but wrong card instead of
 * a retry.
 */
const THROTTLED = /max rate limit|rate limit reached|too many requests/i;

/**
 * The free plan allows 5 calls/second. One card fans out to 8 calls across two
 * chains and they all start at once, so without pacing a third of them come
 * back throttled — which is what made consecutive runs of the same wallet
 * disagree about its age and activity.
 *
 * Requests are admitted one every MIN_INTERVAL_MS. Only admission is
 * serialized; the requests themselves still overlap, so this caps the rate
 * without turning the fan-out back into a queue.
 */
const MIN_INTERVAL_MS = 220;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let admission: Promise<unknown> = Promise.resolve();
let lastAdmittedAt = 0;

function admit(): Promise<void> {
  const gate = admission.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastAdmittedAt);
    if (wait > 0) await sleep(wait);
    lastAdmittedAt = Date.now();
  });

  // Never let one rejection poison the queue for every later caller.
  admission = gate.catch(() => undefined);
  return gate;
}

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
): Promise<AccountRows> {
  const apikey = process.env.ETHERSCAN_API_KEY;
  if (!apikey) return [];

  return resilient<AccountRows>(
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

      await admit();

      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json: unknown = await response.json();
      const result = typeof json === "object" && json !== null ? (json as { result?: unknown; message?: unknown }) : {};

      // Etherscan answers both "No transactions found" and a plan refusal with
      // status 0 and a string result. The first is an empty history; the second
      // means this key may never read this chain. Neither should be retried,
      // but only one of them should fall back to another source.
      if (typeof result.result === "string") {
        if (REFUSAL.test(result.result)) return CHAIN_UNSUPPORTED;

        // Throwing hands this to resilient's backoff; returning [] here would
        // record a throttled call as an empty wallet.
        if (THROTTLED.test(result.result)) throw new Error(`throttled: ${result.result}`);

        return [];
      }

      return asRecords(result.result).slice(0, MAX_HISTORY);
    },
    [],
  );
}

export async function getTransactions(
  address: string,
  chainId: ChainId,
): Promise<RawTx[] | typeof CHAIN_UNSUPPORTED> {
  const rows = await account(address, chainId, "txlist");
  if (rows === CHAIN_UNSUPPORTED) return CHAIN_UNSUPPORTED;

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
): Promise<RawTokenTransfer[] | typeof CHAIN_UNSUPPORTED> {
  const rows = await account(address, chainId, "tokentx");
  if (rows === CHAIN_UNSUPPORTED) return CHAIN_UNSUPPORTED;

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
): Promise<RawNftTransfer[] | typeof CHAIN_UNSUPPORTED> {
  const rows = await account(address, chainId, "tokennfttx");
  if (rows === CHAIN_UNSUPPORTED) return CHAIN_UNSUPPORTED;

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
export async function getFirstTxTimestamp(
  address: string,
  chainId: ChainId,
): Promise<number | typeof CHAIN_UNSUPPORTED> {
  const rows = await account(address, chainId, "txlist", { sort: "asc", offset: 1 });
  if (rows === CHAIN_UNSUPPORTED) return CHAIN_UNSUPPORTED;

  return rows.length > 0 ? num(rows[0].timeStamp) : 0;
}
