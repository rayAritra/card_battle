import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness and dependency check, for uptime monitoring.
 *
 * Every fetcher in this app fails soft, which is what keeps a card rendering
 * when an upstream is down — but it also means an outage is invisible from the
 * outside. This endpoint makes the degraded state observable: it reports which
 * dependencies are configured and whether the database actually answers.
 *
 * Reports configuration, never values. A missing optional key is "off", not an
 * error, so a green check here means "as healthy as this deployment intends to
 * be" rather than "every possible integration is enabled".
 */
export async function GET() {
  const configured = {
    etherscan: Boolean(process.env.ETHERSCAN_API_KEY),
    alchemy: Boolean(process.env.ALCHEMY_API_KEY),
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    upstash: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    llm: Boolean(process.env.LLM_API_KEY),
    farcaster: Boolean(process.env.FARCASTER_ACCOUNT_ASSOCIATION),
  };

  const startedAt = Date.now();
  let database: "ok" | "unreachable" | "not_configured" = "not_configured";

  const client = db();
  if (client) {
    const { error } = await client.from("wallet_cards").select("address", { head: true, count: "exact" });
    database = error ? "unreachable" : "ok";
  }

  // Required credentials are the ones without which cards are empty rather
  // than merely plainer, so only those can turn the check red.
  const healthy = configured.etherscan && configured.alchemy && database !== "unreachable";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database,
      databaseLatencyMs: client ? Date.now() - startedAt : null,
      configured,
      at: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
