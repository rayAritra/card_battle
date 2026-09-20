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

/**
 * The zero address, used to represent a chain's native coin.
 *
 * Native ETH is not an ERC-20 and has no contract, but it still has to flow
 * through the same holdings pipeline as every token, so it travels under the
 * conventional sentinel and is translated here.
 */
export const NATIVE_CONTRACT = "0x0000000000000000000000000000000000000000";

/**
 * Key used by both the request and the returned map: "ethereum:0xabc…".
 *
 * Native balances resolve to one shared coingecko key rather than a per-chain
 * one: ETH on Base is the same asset at the same price as ETH on mainnet, so
 * giving them separate keys would only cost an extra lookup for one answer.
 */
export const priceKey = ({ contract, chainId }: PriceRequest): string =>
  contract.toLowerCase() === NATIVE_CONTRACT
    ? "coingecko:ethereum"
    : `${LLAMA_CHAIN[chainId]}:${contract.toLowerCase()}`;

/** Everything DefiLlama returns for a coin, not just the price. */
export interface CoinInfo {
  price: number;
  symbol: string;
  decimals: number;
}

/**
 * Full coin data keyed by `priceKey`.
 *
 * DefiLlama returns `symbol` and `decimals` alongside `price` in the same
 * response, which is worth using: it identifies a token in one free call with
 * no key, where the equivalent per-token metadata lookup costs a paid request
 * each. A token absent from the response is simply unpriced.
 */
export async function getCoinInfo(requests: PriceRequest[]): Promise<Record<string, CoinInfo>> {
  const keys = [...new Set(requests.map(priceKey))];
  if (keys.length === 0) return {};

  const batches: string[][] = [];
  for (let i = 0; i < keys.length; i += BATCH_SIZE) batches.push(keys.slice(i, i + BATCH_SIZE));

  const results = await Promise.all(
    batches.map((batch) =>
      resilient<Record<string, CoinInfo>>(
        "defillama:coins",
        async () => {
          const response = await fetch(
            `https://coins.llama.fi/prices/current/${batch.join(",")}`,
            { cache: "no-store" },
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const json: unknown = await response.json();
          const coins = isRecord(json) && isRecord(json.coins) ? json.coins : {};

          const info: Record<string, CoinInfo> = {};
          for (const [key, value] of Object.entries(coins)) {
            if (!isRecord(value)) continue;
            const decimals = num(value.decimals);
            info[key.toLowerCase()] = {
              price: num(value.price),
              symbol: typeof value.symbol === "string" ? value.symbol : "",
              decimals: Number.isFinite(decimals) && decimals > 0 ? decimals : 18,
            };
          }
          return info;
        },
        {},
      ),
    ),
  );

  return Object.assign({}, ...results) as Record<string, CoinInfo>;
}

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
