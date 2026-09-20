import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveIdentity } from "@/lib/server/resolve";
import { checkRateLimit } from "@/lib/server/rate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Generous relative to /api/card: a resolution is one cached RPC call at
 * worst, and the input sits behind a keystroke.
 */
const LIMIT_PER_HOUR = 120;

/** Resolves an ENS name, a basename or an address to a canonical address. */
export async function GET(request: Request) {
  const headerList = await headers();
  const verdict = await checkRateLimit(
    "resolve",
    LIMIT_PER_HOUR,
    new Request("https://local/resolve", { headers: headerList }),
  );
  if (!verdict.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";
  const identity = await resolveIdentity(query);

  if (!identity) {
    return NextResponse.json({ error: "unresolved" }, { status: 404 });
  }

  return NextResponse.json(identity, {
    headers: { "cache-control": "public, max-age=300" },
  });
}
