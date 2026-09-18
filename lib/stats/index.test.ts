import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STAT_KEYS, type WalletProfile } from "@/types";
import { emptyProfile } from "@/lib/chain/normalize";
import {
  ALL_FIXTURES,
  emptyWallet,
  freshWallet,
  highFrequencyTrader,
  nftOnlyWallet,
  stablecoinOnlyWallet,
  whale2017,
} from "./__fixtures__";
import { ABILITIES, assignAbility } from "./abilities";
import { ARCHETYPE_CENTROIDS, classifyArchetype } from "./archetypes";
import { computeCard, computeStats, cardSerial } from ".";
import { computeLevel } from "./level";
import { computeRarity } from "./rarity";
import { scoreDefi } from "./defi";
import { MAX_SCORE, MIN_SCORE, percentileScore, recomputeBaselineFromRaw } from "./scoring";

describe("every fixture produces a valid card", () => {
  for (const [name, profile] of Object.entries(ALL_FIXTURES)) {
    it(name, () => {
      const card = computeCard(profile);

      for (const key of STAT_KEYS) {
        const stat = card.stats[key];
        expect(Number.isNaN(stat.score), `${key} score is NaN`).toBe(false);
        expect(Number.isNaN(stat.raw), `${key} raw is NaN`).toBe(false);
        expect(stat.score).toBeGreaterThanOrEqual(MIN_SCORE);
        expect(stat.score).toBeLessThanOrEqual(MAX_SCORE);
        expect(Number.isInteger(stat.score)).toBe(true);
        expect(stat.reasons.length).toBeGreaterThan(0);
        expect(stat.reasons.length).toBeLessThanOrEqual(3);
      }

      expect(card.level).toBeGreaterThanOrEqual(1);
      expect(card.level).toBeLessThanOrEqual(99);
      expect(Number.isInteger(card.level)).toBe(true);

      expect(Object.keys(ARCHETYPE_CENTROIDS)).toContain(card.archetype);
      expect(card.ability.id).not.toBe("");
      expect(card.ability.flavor).not.toMatch(/\{[A-Z_]+\}/);
      expect(card.serial).toMatch(/^#\d{4}$/);
      expect(card.netWorth).not.toBe("NaN");
      expect(JSON.stringify(card)).not.toContain("null,null");
    });
  }
});

describe("stat bounds hold at the extremes", () => {
  it("clamps an absurdly large profile to 99 and never 100", () => {
    const monstrous: WalletProfile = {
      ...whale2017,
      walletAgeDays: 1e9,
      totalTxCount: 1e9,
      distinctActiveMonths: 1e6,
      swapCount: 1e9,
      uniqueTokensTraded: 1e6,
      txsPerActiveMonth: 1e6,
      dexProtocolsUsed: ["a", "b", "c", "d", "e", "f", "g", "h"],
      memecoinVolumeShare: 1,
      leverageProtocolTxCount: 1e6,
      openApprovalCount: 1e6,
      newContractInteractionCount: 1e6,
    };
    const stats = computeStats(monstrous);
    // Saturating sub-signals mean not every axis can pin at exactly 99, but
    // nothing may exceed it and the ceiling must be reachable.
    for (const key of STAT_KEYS) expect(stats[key].score).toBeLessThanOrEqual(MAX_SCORE);
    expect(stats.experience.score).toBe(MAX_SCORE);
    expect(stats.trading.score).toBe(MAX_SCORE);
    expect(computeLevel(stats)).toBeGreaterThanOrEqual(90);
    expect(computeLevel(stats)).toBeLessThanOrEqual(99);
  });

  it("floors an empty profile at 12 and never 0", () => {
    const stats = computeStats(emptyProfile("0x00000000000000000000000000000000000000aa"));
    for (const key of STAT_KEYS) expect(stats[key].score).toBe(MIN_SCORE);
    expect(computeLevel(stats)).toBe(1);
  });

  it("rejects negative and non-finite raws", () => {
    expect(percentileScore("experience", Number.NaN)).toBe(MIN_SCORE);
    expect(percentileScore("experience", -50)).toBe(MIN_SCORE);
    expect(percentileScore("experience", Number.POSITIVE_INFINITY)).toBe(MAX_SCORE);
  });
});

describe("DEFI rewards category coverage over single-protocol depth", () => {
  it("six categories beat forty transactions on one protocol", () => {
    const broad: WalletProfile = {
      ...emptyProfile("0x00000000000000000000000000000000000000b1"),
      protocolsTouched: ["Uniswap V3", "Aave V3", "Lido", "Seaport", "Base Bridge", "Pendle"],
      protocolCategories: ["dex", "lending", "staking", "nft", "bridge", "derivatives"],
      deepestProtocolTxCount: 6,
    };
    const deep: WalletProfile = {
      ...emptyProfile("0x00000000000000000000000000000000000000d1"),
      protocolsTouched: ["Uniswap V3"],
      protocolCategories: ["dex"],
      deepestProtocolTxCount: 40,
    };

    expect(scoreDefi(broad).score).toBeGreaterThan(scoreDefi(deep).score);
  });
});

describe("archetypes", () => {
  it("assigns GHOST WALLET to a wallet with no history", () => {
    expect(computeCard(emptyWallet).archetype).toBe("GHOST WALLET");
  });

  it("never assigns GHOST WALLET to a wallet that has done something", () => {
    expect(computeCard(freshWallet).archetype).not.toBe("GHOST WALLET");
  });

  it("assigns NFT WARLOCK to an NFT-dominant wallet", () => {
    expect(computeCard(nftOnlyWallet).archetype).toBe("NFT WARLOCK");
  });

  it("defines 16 archetypes and every region of the space is reachable", () => {
    const names = Object.keys(ARCHETYPE_CENTROIDS);
    expect(names).toHaveLength(16);

    // Each non-GHOST centroid must classify as itself, which proves no
    // archetype is shadowed by a neighbour.
    for (const [name, centroid] of Object.entries(ARCHETYPE_CENTROIDS)) {
      if (name === "GHOST WALLET") continue;

      const stats = computeStats(emptyProfile("0x00000000000000000000000000000000000000cc"));
      STAT_KEYS.forEach((key, index) => {
        stats[key].score = Math.round(MIN_SCORE + centroid[index] * (MAX_SCORE - MIN_SCORE));
      });

      const profile = { ...emptyProfile("0x00000000000000000000000000000000000000cc"), totalTxCount: 50 };
      expect(classifyArchetype(stats, profile), `${name} is unreachable`).toBe(name);
    }
  });
});

describe("abilities", () => {
  it("defines 30 abilities with unique ids and rarities 1..5", () => {
    expect(ABILITIES).toHaveLength(30);
    expect(new Set(ABILITIES.map((ability) => ability.id)).size).toBe(30);
    for (const ability of ABILITIES) {
      expect(ability.rarity).toBeGreaterThanOrEqual(1);
      expect(ability.rarity).toBeLessThanOrEqual(5);
      expect(ability.name).not.toBe("");
    }
  });

  it("always assigns one, even to an empty wallet", () => {
    const profile = emptyProfile("0x00000000000000000000000000000000000000ee");
    const ability = assignAbility(profile, computeStats(profile));
    expect(ability.id).not.toBe("");
    expect(ability.rarity).toBeGreaterThanOrEqual(1);
  });

  it("awards the rarest qualifying ability", () => {
    const stats = computeStats(whale2017);
    const ability = assignAbility(whale2017, stats);
    const qualifyingRarities = ABILITIES.filter((candidate) =>
      candidate.trigger(whale2017, stats),
    ).map((candidate) => candidate.rarity);

    expect(ability.rarity).toBe(Math.max(...qualifyingRarities));
  });

  it("resolves every placeholder in the flavor line", () => {
    for (const profile of Object.values(ALL_FIXTURES)) {
      const ability = assignAbility(profile, computeStats(profile));
      expect(ability.flavor).not.toMatch(/\{[A-Z_]+\}/);
    }
  });
});

describe("rarity and level", () => {
  it("escalates with level", () => {
    const stats = computeStats(whale2017);
    expect(computeRarity(95, stats)).toBe("mythic");
    expect(computeRarity(10, computeStats(emptyWallet))).toBe("common");
  });

  it("gives the whale a higher level than the fresh wallet", () => {
    expect(computeCard(whale2017).level).toBeGreaterThan(computeCard(freshWallet).level);
  });
});

describe("determinism and purity", () => {
  it("produces byte-identical cards across runs", () => {
    for (const profile of Object.values(ALL_FIXTURES)) {
      expect(JSON.stringify(computeCard(profile))).toBe(JSON.stringify(computeCard(profile)));
    }
  });

  it("derives a stable serial from the address", () => {
    expect(cardSerial(whale2017.address)).toBe(cardSerial(whale2017.address));
    expect(cardSerial("0xnothex")).toMatch(/^#\d{4}$/);
  });

  it("contains no fetch, Date.now, Math.random or process.env under lib/stats", () => {
    const dir = join(process.cwd(), "lib", "stats");
    const files = readdirSync(dir, { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"));

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = readFileSync(join(dir, file), "utf8");
      expect(source, `${file} performs I/O`).not.toMatch(/\bfetch\s*\(/);
      expect(source, `${file} reads the clock`).not.toMatch(/Date\.now\s*\(/);
      expect(source, `${file} uses randomness`).not.toMatch(/Math\.random\s*\(/);
      expect(source, `${file} reads the environment`).not.toMatch(/process\.env/);
    }
  });
});

describe("baseline regeneration", () => {
  it("produces a monotonic table from a raw population", () => {
    const table = recomputeBaselineFromRaw({
      experience: [0.1, 0.4, 0.2, 0.9, 0.6],
      trading: [0.05, 0.5],
      defi: [0.3],
      holding: [0.2, 0.8, 0.5],
      risk: [0, 1],
    });

    for (const key of STAT_KEYS) {
      const points = table[key];
      expect(points.length).toBeGreaterThan(1);
      for (let i = 1; i < points.length; i++) expect(points[i]).toBeGreaterThanOrEqual(points[i - 1]);
    }
  });
});

describe("portfolio-composition overrides", () => {
  it("calls an all-stablecoin portfolio a STABLECOIN MONK, not a whale", () => {
    expect(computeCard(stablecoinOnlyWallet).archetype).toBe("STABLECOIN MONK");
  });

  it("does not apply the override to a mixed portfolio", () => {
    expect(computeCard(whale2017).archetype).not.toBe("STABLECOIN MONK");
  });
});

describe("the stablecoin override does not swallow traders", () => {
  it("keeps a high-frequency trader out of STABLECOIN MONK when it is parked in cash", () => {
    // This wallet holds nothing but USDC, but it has 1,400 swaps and 41% of its
    // flow in memecoins. Composition alone must not rename it.
    expect(highFrequencyTrader.currentHoldings.every((h) => h.symbol === "USDC")).toBe(true);
    expect(computeCard(highFrequencyTrader).archetype).not.toBe("STABLECOIN MONK");
  });
});
