import type { ChainId } from "@/types";
import { isRecord, num, resilient, str } from "./shared";

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

/** Cap on positions priced per chain — keeps a whale's dust from blowing up latency. */
const MAX_POSITIONS = 40;

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
export async function getBalances(address: string, chainId: ChainId): Promise<RawBalance[]> {
  return resilient(
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
        .slice(0, MAX_POSITIONS);

      const metadata = await Promise.all(
        nonZero.map((row) =>
          resilient(
            `alchemy:metadata:${chainId}`,
            () => rpc<{ symbol?: unknown; decimals?: unknown }>(chainId, "alchemy_getTokenMetadata", [row.contract]),
            {} as { symbol?: unknown; decimals?: unknown },
          ),
        ),
      );

      return nonZero.map((row, index) => {
        const meta = metadata[index] ?? {};
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
}
