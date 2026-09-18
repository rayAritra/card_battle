import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STAT_KEYS, type Card, type StatKey, type Stats } from "@/types";
import { computeCard } from "@/lib/stats";
import {
  freshWallet,
  highFrequencyTrader,
  nftOnlyWallet,
  stablecoinOnlyWallet,
  whale2017,
} from "@/lib/stats/__fixtures__";
import { battle, ROUNDS } from "./engine";
import { seedFromInputs } from "./rng";

const DATE = "2026-09-18";

const whale = computeCard(whale2017);
const trader = computeCard(highFrequencyTrader);
const fresh = computeCard(freshWallet);
const collector = computeCard(nftOnlyWallet);
const monk = computeCard(stablecoinOnlyWallet);

const ALL = [whale, trader, fresh, collector, monk];

/** Builds a card with exact stats, for testing specific ability interactions. */
function cardWith(
  address: string,
  scores: Record<StatKey, number>,
  overrides: Partial<Card> = {},
): Card {
  const stats = Object.fromEntries(
    STAT_KEYS.map((key) => [key, { score: scores[key], raw: 0, reasons: ["test"] }]),
  ) as Stats;

  return {
    address,
    ensName: null,
    chainsActive: [1],
    archetype: "CHAIN TOURIST",
    level: 50,
    rarity: "rare",
    stats,
    ability: {
      id: "spark_of_the_chain",
      name: "SPARK OF THE CHAIN",
      rarity: 1,
      battleEffect: { kind: "boostStat", stat: "experience", amount: 4 },
      flavor: "test",
    },
    tagline: "test",
    netWorth: "$1K",
    serial: "#0001",
    computedAt: 0,
    ...overrides,
  };
}

describe("order independence", () => {
  it("gives the same winner and the same log whichever card is passed first", () => {
    for (const a of ALL) {
      for (const b of ALL) {
        if (a.address === b.address) continue;

        const forward = battle(a, b, DATE);
        const reverse = battle(b, a, DATE);

        expect(reverse.winner).toBe(forward.winner);
        expect(reverse.loser).toBe(forward.loser);
        expect(reverse.margin).toBe(forward.margin);
        expect(JSON.stringify(reverse.rounds)).toBe(JSON.stringify(forward.rounds));
        expect(JSON.stringify(reverse)).toBe(JSON.stringify(forward));
      }
    }
  });

  it("seeds identically regardless of address order", () => {
    expect(seedFromInputs(whale.address, trader.address, DATE, 0)).toBe(
      seedFromInputs(trader.address, whale.address, DATE, 0),
    );
  });
});

describe("determinism", () => {
  it("produces byte-identical JSON across runs", () => {
    for (const a of ALL) {
      for (const b of ALL) {
        if (a.address === b.address) continue;
        expect(JSON.stringify(battle(a, b, DATE))).toBe(JSON.stringify(battle(a, b, DATE)));
      }
    }
  });

  it("changes with the date but stays deterministic", () => {
    const today = battle(whale, trader, DATE);
    const tomorrow = battle(whale, trader, "2026-09-19");

    expect(JSON.stringify(tomorrow)).toBe(JSON.stringify(battle(whale, trader, "2026-09-19")));
    expect(tomorrow.seed).not.toBe(today.seed);
  });

  it("changes the log when the nonce increments, and stays deterministic", () => {
    const first = battle(whale, trader, DATE, 0);
    const rematch = battle(whale, trader, DATE, 1);

    expect(rematch.seed).not.toBe(first.seed);
    expect(JSON.stringify(rematch.rounds)).not.toBe(JSON.stringify(first.rounds));
    expect(JSON.stringify(rematch)).toBe(JSON.stringify(battle(whale, trader, DATE, 1)));

    // And a rematch is still order independent.
    expect(JSON.stringify(battle(trader, whale, DATE, 1))).toBe(JSON.stringify(rematch));
  });
});

describe("structure", () => {
  it("always plays exactly five rounds with a decisive winner", () => {
    for (const a of ALL) {
      for (const b of ALL) {
        if (a.address === b.address) continue;

        const result = battle(a, b, DATE);
        expect(result.rounds).toHaveLength(ROUNDS);
        expect(result.winner).not.toBe(result.loser);
        expect([a.address, b.address]).toContain(result.winner);
        expect(result.margin).toBeGreaterThan(0);

        const wins = result.rounds.filter((round) => round.winner === result.winner).length;
        const losses = ROUNDS - wins;
        expect(wins).toBeGreaterThan(losses);
        expect(result.margin).toBe(wins - losses);

        for (const round of result.rounds) {
          expect(STAT_KEYS).toContain(round.category);
          expect([a.address, b.address]).toContain(round.winner);
          expect(Number.isNaN(round.rollA)).toBe(false);
          expect(Number.isNaN(round.rollB)).toBe(false);
        }
      }
    }
  });

  it("logs A and B by canonical address order, not argument order", () => {
    const result = battle(trader, whale, DATE);
    const [firstAddress] = [trader.address, whale.address].sort();
    const firstCard = firstAddress === whale.address ? whale : trader;

    // statA must match the canonically-first card's stat for that category.
    for (const round of result.rounds) {
      const expected = firstCard.stats[round.category].score;
      expect(Math.abs(round.statA - expected)).toBeLessThanOrEqual(12);
    }
  });
});

describe("upsets are possible", () => {
  it("lets a weaker card win at least sometimes across nonces", () => {
    const strong = cardWith("0xaaaa000000000000000000000000000000000001", {
      experience: 90,
      trading: 88,
      defi: 86,
      holding: 84,
      risk: 82,
    });
    const weak = cardWith("0xbbbb000000000000000000000000000000000002", {
      experience: 74,
      trading: 72,
      defi: 70,
      holding: 90,
      risk: 68,
    });

    const results = Array.from({ length: 40 }, (_, nonce) =>
      battle(strong, weak, DATE, nonce),
    );
    const weakWins = results.filter((result) => result.winner === weak.address).length;

    expect(weakWins).toBeGreaterThan(0);
    expect(weakWins).toBeLessThan(results.length);
  });
});

describe("abilities", () => {
  const scores: Record<StatKey, number> = {
    experience: 60,
    trading: 60,
    defi: 60,
    holding: 60,
    risk: 60,
  };

  it("negateFirstLoss converts exactly one lost round", () => {
    const saved = cardWith("0xaaaa000000000000000000000000000000000003", scores, {
      ability: {
        id: "diamond_hands",
        name: "DIAMOND HANDS",
        rarity: 4,
        battleEffect: { kind: "negateFirstLoss" },
        flavor: "test",
      },
    });
    const plain = cardWith("0xbbbb000000000000000000000000000000000004", scores);

    // Across many nonces the save must fire, and never more than once.
    const fired = Array.from({ length: 30 }, (_, nonce) => battle(saved, plain, DATE, nonce)).map(
      (result) =>
        result.rounds.filter((round) => round.abilitiesTriggered.includes("DIAMOND HANDS")).length,
    );

    expect(Math.max(...fired)).toBe(1);
    expect(fired.some((count) => count === 1)).toBe(true);
  });

  it("ignoreOpponentAbility suppresses the opponent's effect", () => {
    const suppressor = cardWith("0xaaaa000000000000000000000000000000000005", scores, {
      ability: {
        id: "omnichain_sovereign",
        name: "OMNICHAIN SOVEREIGN",
        rarity: 5,
        battleEffect: { kind: "ignoreOpponentAbility" },
        flavor: "test",
      },
    });
    const boosted = cardWith("0xbbbb000000000000000000000000000000000006", scores, {
      ability: {
        id: "deep_liquidity",
        name: "DEEP LIQUIDITY",
        rarity: 5,
        battleEffect: { kind: "boostStat", stat: "defi", amount: 12 },
        flavor: "test",
      },
    });

    const result = battle(suppressor, boosted, DATE);
    const anyBoost = result.rounds.some((round) =>
      round.abilitiesTriggered.includes("DEEP LIQUIDITY"),
    );
    expect(anyBoost).toBe(false);
  });

  it("boostStat only applies on its own category", () => {
    const booster = cardWith("0xaaaa000000000000000000000000000000000007", scores, {
      ability: {
        id: "boost",
        name: "BOOST",
        rarity: 3,
        battleEffect: { kind: "boostStat", stat: "holding", amount: 9 },
        flavor: "test",
      },
    });
    const plain = cardWith("0xbbbb000000000000000000000000000000000008", scores);

    for (let nonce = 0; nonce < 20; nonce++) {
      for (const round of battle(booster, plain, DATE, nonce).rounds) {
        if (round.category !== "holding") {
          expect(round.abilitiesTriggered).not.toContain("BOOST");
        }
      }
    }
  });
});

describe("purity of lib/battle", () => {
  it("contains no Math.random, Date.now, fetch or process.env", () => {
    const dir = join(process.cwd(), "lib", "battle");
    const files = readdirSync(dir, { recursive: true, encoding: "utf8" }).filter(
      (file) => file.endsWith(".ts") && !file.endsWith(".test.ts"),
    );

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = readFileSync(join(dir, file), "utf8");
      expect(source, `${file} uses randomness`).not.toMatch(/Math\.random\s*\(/);
      expect(source, `${file} reads the clock`).not.toMatch(/Date\.now\s*\(/);
      expect(source, `${file} performs I/O`).not.toMatch(/\bfetch\s*\(/);
      expect(source, `${file} reads the environment`).not.toMatch(/process\.env/);
    }
  });
});
