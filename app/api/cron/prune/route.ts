import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { log, errorMessage } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Deletes expired `api_cache` rows.
 *
 * Nothing else removes them, and the cached upstream payloads are by far the
 * largest thing this app stores — left alone they are what exhausts the
 * database quota first, well before any API rate limit. The schema indexes
 * `fetched_at` for exactly this delete.
 *
 * Name resolutions are kept: they live under chain 0 with a week-long TTL, so
 * pruning them on the 24h schedule would evict entries that are still valid.
 */
const TTL_HOURS = 24;

/**
 * Vercel cron paths are publicly reachable, so the secret is what separates a
 * scheduled run from anyone who guesses the URL. With no secret configured the
 * route refuses rather than running unauthenticated.
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const client = db();
  if (!client) {
    return NextResponse.json({ error: "no_database" }, { status: 503 });
  }

  const cutoff = new Date(Date.now() - TTL_HOURS * 3_600_000).toISOString();

  try {
    const { error, count } = await client
      .from("api_cache")
      .delete({ count: "exact" })
      .lt("fetched_at", cutoff)
      .neq("chain", 0);

    if (error) throw error;

    log("info", "cron.prune", { deleted: count ?? 0, cutoff });

    return NextResponse.json(
      { ok: true, deleted: count ?? 0, cutoff },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    log("warn", "cron.prune.failed", { error: errorMessage(error) });
    return NextResponse.json({ error: "prune_failed" }, { status: 500 });
  }
}
