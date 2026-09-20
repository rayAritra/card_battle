import { NextResponse } from "next/server";
import { battle } from "@/lib/battle/engine";
import { log, errorMessage } from "@/lib/log";
import { getOrComputeCard, isValidAddress, normalizeAddress } from "@/lib/server/card";
import { checkRateLimit } from "@/lib/server/rate";
import { persistBattle } from "@/lib/server/battle";
import { isRecord } from "@/lib/chain/shared";
import { utcDate } from "@/lib/utils/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT_PER_HOUR = 60;

export async function POST(request: Request) {
  const verdict = await checkRateLimit("battle", LIMIT_PER_HOUR, request);
  if (!verdict.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: `The arena is at capacity. ${LIMIT_PER_HOUR} clashes per hour.`,
        retryAt: verdict.reset,
      },
      { status: 429, headers: { "retry-after": "3600" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_json", message: "Malformed request." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "bad_json", message: "Malformed request." }, { status: 400 });
  }

  const { addrA, addrB, nonce } = body;

  if (
    typeof addrA !== "string" ||
    typeof addrB !== "string" ||
    !isValidAddress(addrA) ||
    !isValidAddress(addrB)
  ) {
    return NextResponse.json(
      { error: "invalid_address", message: "Two valid wallet identities must enter the arena." },
      { status: 400 },
    );
  }

  const a = normalizeAddress(addrA);
  const b = normalizeAddress(addrB);

  if (a === b) {
    return NextResponse.json(
      { error: "same_address", message: "A legend cannot battle itself." },
      { status: 400 },
    );
  }

  try {
    const [cardA, cardB] = await Promise.all([getOrComputeCard(a), getOrComputeCard(b)]);
    const dateUtc = utcDate();
    const safeNonce = typeof nonce === "number" && Number.isFinite(nonce) ? Math.floor(nonce) : 0;

    const result = battle(cardA.card, cardB.card, dateUtc, safeNonce);
    await persistBattle(result, a, b);

    return NextResponse.json(result);
  } catch (error) {
    log("error", "api.battle", { addrA: a, addrB: b, error: errorMessage(error) });
    return NextResponse.json(
      { error: "battle_failed", message: "The arena went silent. Call for a rematch shortly." },
      { status: 500 },
    );
  }
}
