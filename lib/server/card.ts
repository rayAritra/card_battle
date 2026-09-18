import { isAddress } from "viem";
import { buildWalletProfile } from "@/lib/chain/normalize";
import { db } from "@/lib/db/client";
import { log, errorMessage } from "@/lib/log";
import { computeCard } from "@/lib/stats";
import { generateFlavor } from "@/lib/flavor/generate";
import type { Card } from "@/types";

/** How long a computed card stays fresh before it is recomputed on demand. */
const CARD_TTL_MS = 24 * 3_600_000;

export interface StoredCard {
  card: Card;
  hideNetWorth: boolean;
  noIndex: boolean;
}

export const normalizeAddress = (address: string): string => address.toLowerCase();

export function isValidAddress(address: string): boolean {
  return isAddress(address, { strict: false });
}

/** Applies the wallet owner's privacy settings to a card before it leaves the server. */
function applyPreferences(card: Card, hideNetWorth: boolean): Card {
  return hideNetWorth ? { ...card, netWorth: "???", hideNetWorth: true } : card;
}

/**
 * Reads a stored card WITHOUT computing one.
 *
 * /api/og uses this: the OG image must never trigger a chain fetch, because a
 * crawler hitting a cold URL would otherwise cost a full profile build.
 */
export async function readStoredCard(address: string): Promise<StoredCard | null> {
  const wallet = normalizeAddress(address);
  const client = db();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("wallet_cards")
      .select("card, hide_net_worth, no_index")
      .eq("address", wallet)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const hideNetWorth = data.hide_net_worth === true;

    return {
      card: applyPreferences(data.card as Card, hideNetWorth),
      hideNetWorth,
      noIndex: data.no_index === true,
    };
  } catch (error) {
    log("warn", "card.read", { address: wallet, error: errorMessage(error) });
    return null;
  }
}

async function persist(card: Card): Promise<void> {
  const client = db();
  if (!client) return;

  try {
    const { error } = await client.from("wallet_cards").upsert(
      {
        address: card.address,
        card,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "address" },
    );
    if (error) throw error;
  } catch (error) {
    log("warn", "card.persist", { address: card.address, error: errorMessage(error) });
  }
}

/**
 * The card for an address: cached when fresh, computed when not.
 *
 * Computing means one profile build (both chains in parallel, each endpoint
 * cached for 24h) plus the pure stat engine, plus flavor text that degrades to
 * static templates when no LLM key is configured.
 */
export async function getOrComputeCard(address: string): Promise<StoredCard> {
  const wallet = normalizeAddress(address);

  const stored = await readStoredCard(wallet);
  if (stored && Date.now() - stored.card.computedAt < CARD_TTL_MS) {
    log("info", "card.hit", { address: wallet });
    return stored;
  }

  const startedAt = Date.now();
  const profile = await buildWalletProfile(wallet);
  const card = computeCard(profile, Date.now());

  const flavor = await generateFlavor(card);
  const finished: Card = {
    ...card,
    tagline: flavor.tagline,
    ability: { ...card.ability, flavor: flavor.abilityFlavor },
  };

  await persist(finished);

  log("info", "card.computed", {
    address: wallet,
    ms: Date.now() - startedAt,
    archetype: finished.archetype,
    level: finished.level,
  });

  return {
    card: applyPreferences(finished, stored?.hideNetWorth ?? false),
    hideNetWorth: stored?.hideNetWorth ?? false,
    noIndex: stored?.noIndex ?? false,
  };
}
