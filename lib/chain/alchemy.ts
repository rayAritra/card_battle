import type { ChainId } from "@/types";
import { NATIVE_CONTRACT, getCoinInfo, priceKey } from "./prices";
import { isRecord, mapWithConcurrency, num, resilient, str } from "./shared";

/**
 * Alchemy's enhanced token APIs, called over plain JSON-RPC.
 *
 * The published `alchemy-sdk` package cannot be installed in this project's
 * environment (it pulls the native `utf-8-validate` addon). These are the same
 * `alchemy_*` methods the SDK wraps, so the data is identical — see README.
 */

const HOSTS: Record<ChainId, string> = {
  1: "eth-mainnet",
  8453: "base-mainnet",
};

/** Cap on positions kept per chain — keeps a whale's dust from blowing up latency. */
const MAX_POSITIONS = 40;

/**
 * How many non-zero positions are valued before the cap is applied.
 *
 * The cap used to be applied to Alchemy's own ordering, which is arbitrary. For
 * a wallet holding a hundred tokens that meant the kept 40 were mostly spam
 * airdrops and the real positions were discarded — net worth read "—" for
 * wallets that plainly had one. Valuing first and cutting afterwards fixes
 * that; this bound keeps the price call itself cheap.
 */
const MAX_VALUED = 200;

/** Simultaneous metadata lookups. Above this Alchemy throttles and undici drops sockets. */
const METADATA_CONCURRENCY = 6;

export interface RawBalance {
  contract: string;
  /** Human-scaled balance, decimals already applied. */
  amount: number;
  symbol: string;
}

export function alchemyRpcUrl(chainId: ChainId): string | null {
  const key = process.env.ALCHEMY_API_KEY;
  return key ? `https://${HOSTS[chainId]}.g.alchemy.com/v2/${key}` : null;
}

async function rpc<T>(chainId: ChainId, method: string, params: unknown[]): Promise<T> {
  const url = alchemyRpcUrl(chainId);
  if (!url) throw new Error("ALCHEMY_API_KEY is not set");

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const json: unknown = await response.json();
  if (!isRecord(json)) throw new Error("malformed RPC envelope");
  if (isRecord(json.error)) throw new Error(str(json.error.message) || "RPC error");
  if (json.result === undefined) throw new Error("RPC result missing");

  return json.result as T;
}

const hexToNumber = (hex: string): number => {
  const parsed = Number(BigInt(hex || "0x0"));
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Non-zero ERC-20 positions with symbol and decimals resolved.
 * Returns [] when the key is missing or Alchemy is down — the card then renders
 * with an unpriced portfolio rather than failing.
 */
/**
 * The chain's native coin balance, as a position.
 *
 * `alchemy_getTokenBalances` returns ERC-20s only, so without this the most
 * valuable thing most wallets hold is invisible and net worth reads as "—" for
 * a wallet that plainly has one. Fails soft to null like every other fetcher.
 */
async function getNativeBalance(address: string, chainId: ChainId): Promise<RawBalance | null> {
  return resilient<RawBalance | null>(
    `alchemy:native:${chainId}`,
    async () => {
      const hex = await rpc<string>(chainId, "eth_getBalance", [address, "latest"]);
      const wei = /^0x[0-9a-fA-F]+$/.test(hex) ? BigInt(hex) : 0n;
      if (wei === 0n) return null;

      const amount = Number(wei) / 1e18;

      return {
        contract: NATIVE_CONTRACT,
        amount: Number.isFinite(amount) ? amount : 0,
        symbol: "ETH",
      };
    },
    null,
  );
}

export async function getBalances(address: string, chainId: ChainId): Promise<RawBalance[]> {
  const native = await getNativeBalance(address, chainId);

  const tokens = await resilient(
    `alchemy:balances:${chainId}`,
    async () => {
      const data = await rpc<{ tokenBalances?: unknown }>(chainId, "alchemy_getTokenBalances", [
        address,
        "erc20",
      ]);

      const rows = Array.isArray(data.tokenBalances) ? data.tokenBalances.filter(isRecord) : [];

      const nonZero = rows
        .map((row) => ({
          contract: str(row.contractAddress).toLowerCase(),
          raw: str(row.tokenBalance),
        }))
        .filter((row) => row.contract !== "" && /^0x[0-9a-f]*$/.test(row.raw) && BigInt(row.raw) > 0n)
        .slice(0, MAX_VALUED);

      // One free, keyless call identifies and values the whole candidate set,
      // so the cap below can keep what the wallet actually holds rather than
      // whichever tokens the balance endpoint happened to list first.
      const coins = await getCoinInfo(nonZero.map((row) => ({ contract: row.contract, chainId })));

      const valued = nonZero.map((row) => {
        const coin = coins[priceKey({ contract: row.contract, chainId })];
        const decimals = coin?.decimals ?? 18;
        const amount = hexToNumber(row.raw) / 10 ** (decimals || 18);
        const safeAmount = Number.isFinite(amount) ? amount : 0;
        const usdValue = safeAmount * (coin?.price ?? 0);

        return {
          contract: row.contract,
          raw: row.raw,
          amount: safeAmount,
          symbol: coin?.symbol ?? "",
          usdValue: Number.isFinite(usdValue) ? usdValue : 0,
          priced: coin !== undefined,
        };
      });

      // Priced positions first, largest first; unpriced tokens keep the
      // remaining slots so a wallet holding nothing DefiLlama knows about
      // still shows a portfolio.
      const kept = valued
        .sort((a, b) => Number(b.priced) - Number(a.priced) || b.usdValue - a.usdValue)
        .slice(0, MAX_POSITIONS);

      // Only the kept positions that DefiLlama could not identify need a paid
      // metadata lookup, which is a small fraction of what this used to cost.
      const unresolved = kept.filter((row) => row.symbol === "");
      const metadata = await mapWithConcurrency(unresolved, METADATA_CONCURRENCY, (row) =>
        resilient(
          `alchemy:metadata:${chainId}`,
          () => rpc<{ symbol?: unknown; decimals?: unknown }>(chainId, "alchemy_getTokenMetadata", [row.contract]),
          {} as { symbol?: unknown; decimals?: unknown },
        ),
      );

      const resolved = new Map(
        unresolved.map((row, index) => [row.contract, metadata[index] ?? {}]),
      );

      return kept.map((row) => {
        if (row.symbol !== "") {
          return { contract: row.contract, amount: row.amount, symbol: row.symbol };
        }

        const meta = resolved.get(row.contract) ?? {};
        const decimals = Number.isFinite(num(meta.decimals)) ? num(meta.decimals) : 18;
        const amount = hexToNumber(row.raw) / 10 ** (decimals || 18);

        return {
          contract: row.contract,
          amount: Number.isFinite(amount) ? amount : 0,
          symbol: str(meta.symbol) || "TOKEN",
        };
      });
    },
    [],
  );

  // Native first: it is the position most wallets hold the most of, and the
  // holdings list is sorted by value downstream anyway.
  return native ? [native, ...tokens] : tokens;
}
