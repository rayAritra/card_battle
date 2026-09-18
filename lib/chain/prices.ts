import type { ChainId } from "@/types";
import { isRecord, num, resilient } from "./shared";

/** DefiLlama's chain slugs for the chains we support. No API key required. */
const LLAMA_CHAIN: Record<ChainId, string> = {
  1: "ethereum",
  8453: "base",
};

/** DefiLlama accepts long comma-joined key lists; batch anyway to stay under URL limits. */
const BATCH_SIZE = 50;

export interface PriceRequest {
  contract: string;
  chainId: ChainId;
}

/** Key used by both the request and the returned map: "ethereum:0xabc…". */
export const priceKey = ({ contract, chainId }: PriceRequest): string =>
  `${LLAMA_CHAIN[chainId]}:${contract.toLowerCase()}`;

/**
 * USD prices keyed by `priceKey`. Missing entries simply mean "unpriced" —
 * the caller treats them as zero rather than failing.
 */
export async function getPrices(requests: PriceRequest[]): Promise<Record<string, number>> {
  const keys = [...new Set(requests.map(priceKey))];
  if (keys.length === 0) return {};

  const batches: string[][] = [];
  for (let i = 0; i < keys.length; i += BATCH_SIZE) batches.push(keys.slice(i, i + BATCH_SIZE));

  const results = await Promise.all(
    batches.map((batch) =>
      resilient<Record<string, number>>(
        "defillama:prices",
        async () => {
          const response = await fetch(
            `https://coins.llama.fi/prices/current/${batch.join(",")}`,
            { cache: "no-store" },
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const json: unknown = await response.json();
          const coins = isRecord(json) && isRecord(json.coins) ? json.coins : {};

          const prices: Record<string, number> = {};
          for (const [key, value] of Object.entries(coins)) {
            if (isRecord(value)) prices[key.toLowerCase()] = num(value.price);
          }
          return prices;
        },
        {},
      ),
    ),
  );

  return Object.assign({}, ...results) as Record<string, number>;
}
