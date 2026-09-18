/**
 * Prints the computed card for live addresses, or for the built-in fixtures.
 *
 *   npm run card -- 0xd8dA…045 vitalik-alt.eth-address …
 *   npm run card -- --fixtures
 *
 * The fixtures path needs no credentials, so it is the fastest way to sanity
 * check the stat engine after touching lib/stats.
 */
import { loadEnv } from "./env";

loadEnv();

const BAR_WIDTH = 24;

function bar(score: number): string {
  const filled = Math.round((score / 99) * BAR_WIDTH);
  return `${"█".repeat(filled)}${"·".repeat(Math.max(0, BAR_WIDTH - filled))}`;
}

async function render(label: string, profile: import("@/types").WalletProfile): Promise<void> {
  const { computeCard } = await import("@/lib/stats");
  const { STAT_KEYS } = await import("@/types");

  const card = computeCard(profile);

  console.log(`\n┌─ ${label}`);
  console.log(`│  ${card.ensName ?? card.address}`);
  console.log(`│  ${card.archetype}   LEVEL ${card.level}   ${card.rarity.toUpperCase()}   ${card.serial}`);
  console.log(`│  net worth ${card.netWorth}   chains [${card.chainsActive.join(", ") || "none"}]`);
  console.log("│");
  for (const key of STAT_KEYS) {
    const stat = card.stats[key];
    console.log(`│  ${key.padEnd(11)} ${String(stat.score).padStart(2)} ${bar(stat.score)}`);
    for (const reason of stat.reasons) console.log(`│     ${reason}`);
  }
  console.log("│");
  console.log(`│  ${card.ability.name} (rarity ${card.ability.rarity})`);
  console.log(`│  "${card.ability.flavor}"`);
  console.log(`│  ${card.tagline}`);
  console.log("└─");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--fixtures")) {
    const { ALL_FIXTURES } = await import("@/lib/stats/__fixtures__");
    for (const [name, profile] of Object.entries(ALL_FIXTURES)) await render(name, profile);
    return;
  }

  const { isAddress } = await import("viem");
  const { buildWalletProfile } = await import("@/lib/chain/normalize");

  for (const input of args) {
    if (!isAddress(input)) {
      console.error(`skipping ${input}: not a valid EVM address`);
      continue;
    }
    const startedAt = Date.now();
    const profile = await buildWalletProfile(input);
    await render(`${input}  (${Date.now() - startedAt}ms)`, profile);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
