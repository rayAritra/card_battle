import { db } from "./client";
import { log, errorMessage } from "@/lib/log";
import type { ChainId } from "@/types";

const HOUR_MS = 3_600_000;

/** Per-process memo, so a single request never round-trips Postgres twice. */
const memory = new Map<string, { value: unknown; at: number }>();

export interface CacheKey {
  address: string;
  chain: ChainId | 0;
  endpoint: string;
}

const memoKey = (key: CacheKey) => `${key.address}:${key.chain}:${key.endpoint}`;

/**
 * Read-through cache over the api_cache table.
 *
 * On a hit younger than ttlHours the fetcher is never called — that is what
 * guarantees "the same address twice in one day makes zero external API calls".
 * Cache failures are logged and ignored: the fetcher still runs.
 */
export async function getCached<T>(
  key: CacheKey,
  ttlHours: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const ttlMs = ttlHours * HOUR_MS;
  const memo = memory.get(memoKey(key));
  if (memo && Date.now() - memo.at < ttlMs) return memo.value as T;

  const client = db();

  if (client) {
    try {
      const { data, error } = await client
        .from("api_cache")
        .select("payload, fetched_at")
        .eq("address", key.address)
        .eq("chain", key.chain)
        .eq("endpoint", key.endpoint)
        .maybeSingle();

      if (error) throw error;

      if (data && Date.now() - new Date(data.fetched_at as string).getTime() < ttlMs) {
        memory.set(memoKey(key), { value: data.payload, at: Date.now() });
        return data.payload as T;
      }
    } catch (error) {
      log("warn", "cache.read", { ...key, error: errorMessage(error) });
    }
  }

  const value = await fetcher();
  memory.set(memoKey(key), { value, at: Date.now() });

  if (client) {
    try {
      const { error } = await client.from("api_cache").upsert({
        address: key.address,
        chain: key.chain,
        endpoint: key.endpoint,
        payload: value,
        fetched_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (error) {
      log("warn", "cache.write", { ...key, error: errorMessage(error) });
    }
  }

  return value;
}

/** Test/CLI hook — drops the in-process memo without touching Postgres. */
export function clearMemoryCache(): void {
  memory.clear();
}
