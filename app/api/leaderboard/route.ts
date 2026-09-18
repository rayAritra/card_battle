import { NextResponse } from "next/server";
import { loadLeaderboard } from "@/lib/server/leaderboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const leaderboard = await loadLeaderboard();
  return NextResponse.json(leaderboard, {
    headers: { "cache-control": "public, max-age=60, stale-while-revalidate=600" },
  });
}
