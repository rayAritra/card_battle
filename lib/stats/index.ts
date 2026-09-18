import type { Card, Stats, WalletProfile } from "@/types";
import { bucketNetWorth } from "@/lib/utils/format";
import { taglineFor } from "@/lib/flavor/templates";
import { assignAbility } from "./abilities";
import { classifyArchetype } from "./archetypes";
import { computeLevel } from "./level";
import { computeRarity } from "./rarity";
import { scoreDefi } from "./defi";
import { scoreExperience } from "./experience";
import { scoreHolding } from "./holding";
import { scoreRisk } from "./risk";
import { scoreTrading } from "./trading";

export { ABILITIES, assignAbility, resolveFlavor } from "./abilities";
export { ARCHETYPE_CENTROIDS, ARCHETYPE_NAMES, classifyArchetype } from "./archetypes";
export { computeLevel } from "./level";
export { computeRarity, RARITY_ORDER } from "./rarity";
export { percentileScore, recomputeBaselineFromRaw, clampScore } from "./scoring";

export function computeStats(profile: WalletProfile): Stats {
  return {
    experience: scoreExperience(profile),
    trading: scoreTrading(profile),
    defi: scoreDefi(profile),
    holding: scoreHolding(profile),
    risk: scoreRisk(profile),
  };
}

/**
 * Deterministic four-digit serial from the low bytes of the address.
 * Cosmetic, but it must never change for a given wallet.
 */
export function cardSerial(address: string): string {
  const tail = address.slice(-6).toLowerCase();
  const parsed = Number.parseInt(tail, 16);
  const serial = Number.isFinite(parsed) ? parsed % 10_000 : 0;
  return `#${String(serial).padStart(4, "0")}`;
}

/**
 * Assembles a finished card from a profile. Pure: same profile in, same card
 * out, no I/O and no clock reads beyond the timestamp the caller supplies.
 */
export function computeCard(profile: WalletProfile, computedAt = 0): Card {
  const stats = computeStats(profile);
  const level = computeLevel(stats);
  const archetype = classifyArchetype(stats, profile);

  return {
    address: profile.address.toLowerCase(),
    ensName: profile.ensName,
    chainsActive: profile.chainsActive,
    archetype,
    level,
    rarity: computeRarity(level, stats),
    stats,
    ability: assignAbility(profile, stats),
    tagline: taglineFor(archetype),
    netWorth: bucketNetWorth(profile.totalUsdValue),
    serial: cardSerial(profile.address),
    computedAt,
  };
}
