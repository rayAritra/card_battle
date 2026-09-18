import { NextResponse } from "next/server";
import { isRecord } from "@/lib/chain/shared";
import { isValidAddress, normalizeAddress } from "@/lib/server/card";
import { appUrl } from "@/lib/server/frame";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Farcaster frame button handler.
 *
 * The frame message carries the viewer's connected/verified address, which we
 * use as the challenger automatically — battling from a feed is one tap. When
 * no address is available we send them to the home page to make a card first.
 */
function challengerFrom(body: unknown): string | null {
  if (!isRecord(body)) return null;

  const untrusted = isRecord(body.untrustedData) ? body.untrustedData : {};
  const candidates = [
    untrusted.address,
    untrusted.connectedAddress,
    untrusted.verifiedAddress,
    ...(Array.isArray(untrusted.verifiedAddresses) ? untrusted.verifiedAddresses : []),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && isValidAddress(candidate)) {
      return normalizeAddress(candidate);
    }
  }
  return null;
}

/** The target card address, passed through as ?a= on the post_url. */
export async function POST(request: Request) {
  const target = new URL(request.url).searchParams.get("a");

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const challenger = challengerFrom(body);
  const base = appUrl();

  if (!target || !isValidAddress(target)) {
    return NextResponse.redirect(base, { status: 302 });
  }

  const wallet = normalizeAddress(target);

  if (!challenger || challenger === wallet) {
    log("info", "frame.no_challenger", { target: wallet });
    return NextResponse.redirect(`${base}/card/${wallet}`, { status: 302 });
  }

  return NextResponse.redirect(`${base}/battle/${wallet}/${challenger}`, { status: 302 });
}
