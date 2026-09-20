import { createPublicClient, http, isAddress, type Address } from "viem";
import { normalize } from "viem/ens";
import { mainnet } from "viem/chains";
import { alchemyRpcUrl } from "./alchemy";
import { resilient } from "./shared";

/**
 * Reverse ENS lookup on mainnet.
 *
 * Uses the Alchemy transport when a key is present and viem's default public
 * mainnet RPC otherwise, so names still resolve in a keyless dev setup.
 */
export async function resolveEns(address: string): Promise<string | null> {
  if (!isAddress(address)) return null;

  return resilient<string | null>(
    "ens:reverse",
    async () => {
      const rpcUrl = alchemyRpcUrl(1);
      const client = createPublicClient({
        chain: mainnet,
        transport: rpcUrl ? http(rpcUrl) : http(),
      });
      const name = await client.getEnsName({ address: address as Address });
      return name ?? null;
    },
    null,
  );
}

/**
 * Forward resolution: a name to an address.
 *
 * Runs against mainnet ENS. Basenames (`name.base.eth`) are registered under
 * `base.eth` with an offchain resolver, so they resolve through the same call
 * via CCIP-read — viem enables that by default. This is why there is no
 * separate Base client here and no hardcoded resolver address.
 *
 * Returns null for anything that does not resolve, including names that
 * normalize to nothing. A bad name is a normal outcome, not an error.
 */
export async function resolveName(name: string): Promise<string | null> {
  const trimmed = name.trim().toLowerCase();
  if (!looksLikeName(trimmed)) return null;

  let normalized: string;
  try {
    normalized = normalize(trimmed);
  } catch {
    return null;
  }

  return resilient<string | null>(
    "ens:forward",
    async () => {
      const rpcUrl = alchemyRpcUrl(1);
      const client = createPublicClient({
        chain: mainnet,
        transport: rpcUrl ? http(rpcUrl) : http(),
      });
      const address = await client.getEnsAddress({ name: normalized });
      return address ?? null;
    },
    null,
  );
}

/**
 * Whether a string is worth spending an RPC call on.
 *
 * Deliberately loose — it only has to exclude obvious non-names, because
 * `resolveName` returning null is already the safe outcome.
 */
export function looksLikeName(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 2 && trimmed.includes(".") && !trimmed.startsWith("0x");
}
