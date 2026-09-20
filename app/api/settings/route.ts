import { NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { isRecord } from "@/lib/chain/shared";
import { db } from "@/lib/db/client";
import { log, errorMessage } from "@/lib/log";
import { isValidAddress, normalizeAddress } from "@/lib/server/card";
import { checkRateLimit } from "@/lib/server/rate";
import { settingsMessage, SIGNATURE_WINDOW_MS } from "@/lib/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT_PER_HOUR = 30;

/**
 * Privacy controls, authorised by a signature from the wallet itself.
 *
 * Only the key holder can change how their own card is presented. The signed
 * message embeds the address, both flag values, and a timestamp, so a captured
 * signature cannot be replayed to set different values or reused indefinitely.
 */
export async function POST(request: Request) {
  const verdict = await checkRateLimit("settings", LIMIT_PER_HOUR, request);
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "Your privacy controls are cooling down. Try again later." },
      { status: 429 },
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

  const { address, signature, hideNetWorth, noIndex, issuedAt } = body;

  if (typeof address !== "string" || !isValidAddress(address)) {
    return NextResponse.json(
      { error: "invalid_address", message: "A valid wallet identity is required." },
      { status: 400 },
    );
  }
  if (typeof signature !== "string" || !signature.startsWith("0x")) {
    return NextResponse.json(
      { error: "missing_signature", message: "Your free wallet signature is required." },
      { status: 400 },
    );
  }
  if (typeof hideNetWorth !== "boolean" || typeof noIndex !== "boolean") {
    return NextResponse.json(
      { error: "invalid_flags", message: "Both settings must be true or false." },
      { status: 400 },
    );
  }
  if (typeof issuedAt !== "number" || !Number.isFinite(issuedAt)) {
    return NextResponse.json(
      { error: "invalid_timestamp", message: "A signature timestamp is required." },
      { status: 400 },
    );
  }

  const age = Date.now() - issuedAt;
  if (age < -60_000 || age > SIGNATURE_WINDOW_MS) {
    return NextResponse.json(
      { error: "expired", message: "That signature has faded. Verify again." },
      { status: 400 },
    );
  }

  const wallet = normalizeAddress(address);
  const message = settingsMessage({ address: wallet, hideNetWorth, noIndex, issuedAt });

  let valid = false;
  try {
    valid = await verifyMessage({
      address: wallet as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch (error) {
    log("warn", "settings.verify", { address: wallet, error: errorMessage(error) });
  }

  if (!valid) {
    return NextResponse.json(
      { error: "bad_signature", message: "That signature does not match this wallet." },
      { status: 401 },
    );
  }

  const client = db();
  if (!client) {
    return NextResponse.json(
      { error: "no_storage", message: "Privacy storage is unavailable right now." },
      { status: 503 },
    );
  }

  try {
    const { error } = await client
      .from("wallet_cards")
      .update({ hide_net_worth: hideNetWorth, no_index: noIndex })
      .eq("address", wallet);

    if (error) throw error;

    log("info", "settings.updated", { address: wallet, hideNetWorth, noIndex });
    return NextResponse.json({ ok: true, hideNetWorth, noIndex });
  } catch (error) {
    log("error", "settings.write", { address: wallet, error: errorMessage(error) });
    return NextResponse.json(
      { error: "write_failed", message: "Your privacy preferences could not be secured." },
      { status: 500 },
    );
  }
}
