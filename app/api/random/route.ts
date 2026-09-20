import { NextResponse } from "next/server";
import { randomOpponent } from "@/lib/server/discovery";
import { isValidAddress, normalizeAddress } from "@/lib/server/card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A stored card to fight, optionally level-matched.
 *
 * `exclude` keeps a wallet from drawing itself; `level` narrows the pool to a
 * fair match. Reads cache only — discovery must never trigger a chain fetch.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const exclude = params.get("exclude") ?? "";
  if (!isValidAddress(exclude)) {
    return NextResponse.json({ error: "invalid_address" }, { status: 400 });
  }

  const rawLevel = Number.parseInt(params.get("level") ?? "", 10);
  const nearLevel = Number.isFinite(rawLevel) && rawLevel > 0 ? rawLevel : undefined;

  const opponent = await randomOpponent(normalizeAddress(exclude), nearLevel);

  if (!opponent) {
    return NextResponse.json({ error: "no_opponents" }, { status: 404 });
  }

  return NextResponse.json(opponent, { headers: { "cache-control": "no-store" } });
}
