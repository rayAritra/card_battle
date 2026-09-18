import { createPublicClient, http, isAddress, type Address } from "viem";
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
