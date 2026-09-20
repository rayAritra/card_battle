import { NextResponse } from "next/server";
import { getOrComputeCard, isValidAddress, normalizeAddress } from "@/lib/server/card";
import { checkRateLimit } from "@/lib/server/rate";
import { log, errorMessage } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT_PER_HOUR = 20;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;

  if (!isValidAddress(address)) {
    return NextResponse.json(
      { error: "invalid_address", message: "The chain knows no such wallet." },
      { status: 400 },
    );
  }

  const verdict = await checkRateLimit("card", LIMIT_PER_HOUR, request);
  if (!verdict.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: `The forge is at capacity. ${LIMIT_PER_HOUR} reveals per hour.`,
        retryAt: verdict.reset,
      },
      { status: 429, headers: { "retry-after": "3600" } },
    );
  }

  try {
    const { card } = await getOrComputeCard(normalizeAddress(address));
    return NextResponse.json(card, {
      headers: { "cache-control": "public, max-age=300, stale-while-revalidate=3600" },
    });
  } catch (error) {
    log("error", "api.card", { address, error: errorMessage(error) });
    return NextResponse.json(
      { error: "card_failed", message: "The chain went silent. Return to the forge shortly." },
      { status: 500 },
    );
  }
}
