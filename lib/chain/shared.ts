import { log, errorMessage } from "@/lib/log";

/** Hard cap from the brief: never process more than this many txs per address per chain. */
export const MAX_HISTORY = 3000;

const RETRIES = 3;
const BASE_BACKOFF_MS = 250;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs a fetcher with 3 attempts and exponential backoff, then FAILS SOFT.
 *
 * A dead endpoint must never prevent a card from rendering, so the final
 * failure is logged as structured JSON and the caller gets `fallback`.
 */
export async function resilient<T>(
  endpoint: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < RETRIES - 1) {
        await sleep(BASE_BACKOFF_MS * 2 ** attempt);
        continue;
      }
      log("warn", "chain.degraded", {
        endpoint,
        attempts: RETRIES,
        error: errorMessage(error),
      });
    }
  }
  return fallback;
}

/** A normal transaction from Etherscan `txlist`. */
export interface RawTx {
  hash: string;
  from: string;
  to: string;
  timeStamp: string;
  input: string;
  value: string;
  isError: string;
  functionName?: string;
}

/** An ERC-20 transfer from Etherscan `tokentx`. */
export interface RawTokenTransfer {
  hash: string;
  from: string;
  to: string;
  timeStamp: string;
  contractAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimal: string;
  value: string;
}

/** An ERC-721 transfer from Etherscan `tokennfttx`. */
export interface RawNftTransfer {
  hash: string;
  from: string;
  to: string;
  timeStamp: string;
  contractAddress: string;
  tokenName: string;
  tokenID: string;
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Narrows an unknown JSON array into records, dropping anything malformed. */
export function asRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

export const str = (value: unknown): string => (typeof value === "string" ? value : "");

export function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(str(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Maps over items with a ceiling on how many run at once.
 *
 * `Promise.all` over a per-item fetcher is a trap here: a whale with 40 token
 * positions, each retried up to 3 times, opens ~120 sockets at once. Undici
 * gives up with a bare "fetch failed" and the provider throttles the rest, so
 * the retries make the failure worse rather than better. Results stay in input
 * order regardless of completion order.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const worker = async (): Promise<void> => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index] as T, index);
    }
  };

  const workers = Array.from({ length: Math.min(Math.max(1, limit), items.length) }, worker);
  await Promise.all(workers);

  return results;
}
