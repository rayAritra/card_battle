import { looksLikeName, resolveName } from "@/lib/chain/ens";
import { getCached } from "@/lib/db/cache";
import { isValidAddress, normalizeAddress } from "./card";

/** A resolved wallet identity: always an address, plus the name if one was used. */
export interface ResolvedIdentity {
  address: string;
  /** The name the visitor typed, when they typed one. */
  name: string | null;
}

/** Name lookups are cached for a week — ENS records change, but rarely. */
const NAME_TTL_HOURS = 168;

/**
 * Turns whatever a visitor typed into an address.
 *
 * Accepts a raw 0x address, an ENS name, or a basename. Returns null when the
 * input is neither a valid address nor a name that resolves, which the callers
 * present as "we could not find that wallet" rather than as an error.
 *
 * Resolution is cached through api_cache under chain 0, so a popular name
 * costs one RPC call per week rather than one per visitor.
 */
export async function resolveIdentity(raw: string): Promise<ResolvedIdentity | null> {
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  if (isValidAddress(trimmed)) {
    return { address: normalizeAddress(trimmed), name: null };
  }

  if (!looksLikeName(trimmed)) return null;

  const name = trimmed.toLowerCase();

  // Wrapped in an object rather than cached as a bare value: a miss resolves to
  // null, and a JSON null would land in a NOT NULL jsonb column.
  const cached = await getCached<{ address: string | null }>(
    { address: name, chain: 0, endpoint: "ens:forward" },
    NAME_TTL_HOURS,
    async () => ({ address: await resolveName(name) }),
  );

  const address = cached?.address ?? null;
  if (!address || !isValidAddress(address)) return null;

  return { address: normalizeAddress(address), name };
}
