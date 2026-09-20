/**
 * Static flavor. These are the fallback whenever LLM_API_KEY is absent or the
 * model returns something unparseable, so they have to stand on their own —
 * they are not placeholders.
 *
 * Voice: terse, confident, slightly mythic. No emoji, no exclamation marks,
 * no financial advice, no price talk, no second person.
 */

export const ARCHETYPE_TAGLINES: Record<string, string> = {
  "GHOST WALLET": "An address with everything still ahead of it",
  "DEFI WARLORD": "Holds territory across every protocol layer",
  "DIAMOND WHALE": "Size, and the patience to ignore it",
  "STABLECOIN MONK": "Wants nothing the market can take away",
  "MEV GREMLIN": "Lives in the space between blocks",
  "AIRDROP FARMER": "Plants early, harvests without sentiment",
  "SERIAL APER": "First through the door, every time",
  "LIQUIDITY SAGE": "Reads depth the way others read price",
  "BRIDGE NOMAD": "Belongs to no single chain",
  "NFT WARLOCK": "Collects what cannot be replaced",
  "GENESIS RELIC": "Older than most of what it survived",
  "COLD VAULT": "Quiet, sealed, and entirely intact",
  "CHAIN TOURIST": "Has seen enough to know the terrain",
  "SPOT MAXIMALIST": "Trades often, leverages never",
  "BAGHOLDER SAINT": "Conviction that outlasted the thesis",
  "CYCLE VETERAN": "Has been early, wrong, and right in turn",
};

export const DEFAULT_TAGLINE = "Written entirely in public";

export const taglineFor = (archetype: string): string =>
  ARCHETYPE_TAGLINES[archetype] ?? DEFAULT_TAGLINE;

/** Battle commentary fallbacks, keyed by how decisive the match was. */
export type MarginBucket = "narrow" | "clear" | "dominant";

export function marginBucket(margin: number): MarginBucket {
  const spread = Math.abs(margin);
  if (spread <= 1) return "narrow";
  if (spread <= 3) return "clear";
  return "dominant";
}

const COMMENTARY: Record<MarginBucket, string> = {
  narrow: "One final exchange decides it. {WINNER} escapes {LOSER} by the finest margin.",
  clear: "{WINNER} seizes the arena early and never gives {LOSER} a way back.",
  dominant: "Total domination. {WINNER} dismantles {LOSER} without surrendering the arena.",
};

export function staticCommentary(
  winnerArchetype: string,
  loserArchetype: string,
  margin: number,
): string {
  return COMMENTARY[marginBucket(margin)]
    .replace("{WINNER}", winnerArchetype)
    .replace("{LOSER}", loserArchetype);
}
