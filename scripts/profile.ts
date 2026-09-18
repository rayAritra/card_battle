/**
 * Prints the derived WalletProfile for one or more addresses.
 *
 *   npm run profile -- 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
 *
 * Reads .env.local if present. With no credentials every fetcher fails soft,
 * so the script still prints a (zeroed) profile rather than crashing.
 */
import { loadEnv } from "./env";

loadEnv();

async function main(): Promise<void> {
  const { isAddress } = await import("viem");
  const { buildWalletProfile } = await import("@/lib/chain/normalize");

  const inputs = process.argv.slice(2);
  if (inputs.length === 0) {
    console.error("usage: npm run profile -- <address> [address...]");
    process.exitCode = 1;
    return;
  }

  for (const input of inputs) {
    if (!isAddress(input)) {
      console.error(`skipping ${input}: not a valid EVM address`);
      continue;
    }

    const startedAt = Date.now();
    const profile = await buildWalletProfile(input);
    const elapsed = Date.now() - startedAt;

    const { currentHoldings, ...summary } = profile;

    console.log(`\n=== ${input} (${elapsed}ms) ===`);
    console.log(JSON.stringify(summary, null, 2));
    console.log(
      `holdings (${currentHoldings.length}):`,
      currentHoldings
        .slice(0, 8)
        .map((holding) => `${holding.symbol} $${Math.round(holding.usdValue)}`)
        .join(", ") || "none",
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
