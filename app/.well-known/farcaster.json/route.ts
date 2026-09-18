import { NextResponse } from "next/server";
import { appUrl } from "@/lib/server/frame";

export const runtime = "nodejs";

/**
 * Farcaster Mini App manifest.
 *
 * `accountAssociation` is signed per-domain by the app's Farcaster custody
 * account and supplied through the environment; without it the app still
 * renders as a frame, it simply cannot be installed as a Mini App.
 */
export function GET() {
  const base = appUrl();

  let accountAssociation: unknown = null;
  try {
    const raw = process.env.FARCASTER_ACCOUNT_ASSOCIATION;
    accountAssociation = raw ? JSON.parse(raw) : null;
  } catch {
    accountAssociation = null;
  }

  return NextResponse.json({
    ...(accountAssociation ? { accountAssociation } : {}),
    miniapp: {
      version: "1",
      name: "Onchain Battle Cards",
      iconUrl: `${base}/api/icon`,
      homeUrl: base,
      imageUrl: `${base}/api/og/generic`,
      buttonTitle: "Battle a wallet",
      splashBackgroundColor: "#08080b",
      subtitle: "Every wallet is a card",
      description:
        "Turn any EVM wallet into a collectible battle card generated from its real onchain history. Entertainment only.",
      primaryCategory: "entertainment",
    },
  });
}
