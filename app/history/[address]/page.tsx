import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InvalidAddress } from "@/components/InvalidAddress";
import { isValidAddress, normalizeAddress, readStoredCard } from "@/lib/server/card";
import { resolveIdentity } from "@/lib/server/resolve";
import { walletHistory } from "@/lib/server/history";
import { truncateAddress } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ address: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { address } = await params;
  if (!isValidAddress(address)) return { title: "Arena history" };

  const wallet = normalizeAddress(address);
  const stored = await readStoredCard(wallet);
  const name = stored?.card.ensName ?? truncateAddress(wallet);

  return {
    title: `${name} · battle history`,
    description: `Every clash this wallet has fought in the arena.`,
    // History is derived from the card, so it inherits the card's visibility.
    robots: stored?.noIndex ? { index: false, follow: false } : undefined,
  };
}

export default async function HistoryPage({ params }: PageProps) {
  const { address } = await params;

  if (!isValidAddress(address)) {
    const identity = await resolveIdentity(address);
    if (!identity) return <InvalidAddress value={address} />;
    redirect(`/history/${identity.address}`);
  }

  const wallet = normalizeAddress(address);
  const [stored, record] = await Promise.all([readStoredCard(wallet), walletHistory(wallet)]);

  const name = stored?.card.ensName ?? truncateAddress(wallet);
  const fought = record.wins + record.losses;

  return (
    <main className="page">
      <header className="board-head">
        <p className="eyebrow">Arena record</p>
        <h1 className="board-head__title display">{name}</h1>
        <p className="board-head__copy">
          Every clash leaves a mark. Each result is locked by both wallets, the battle date and the
          rematch number, so every old showdown can be replayed exactly as it happened.
        </p>

        <div className="record">
          <span className="record__wins">{record.wins}W</span>
          <span className="record__losses">{record.losses}L</span>
          {fought > 0 && (
            <span className="record__rate mono">
              {Math.round((record.wins / fought) * 100)}%
            </span>
          )}
        </div>

        <Link className="button button--ghost" href={`/card/${wallet}`}>
          Return to the card
        </Link>
      </header>

      {record.entries.length === 0 ? (
        <p className="board__empty">
          No clashes yet. Send this card into the arena and begin its legend.
        </p>
      ) : (
        <ol className="history">
          {record.entries.map((entry) => (
            <li key={`${entry.opponent}-${entry.dateUtc}-${entry.nonce}`}>
              <span className={entry.won ? "history__badge history__badge--won" : "history__badge"}>
                {entry.won ? "VICTORY" : "DEFEAT"}
              </span>

              <Link className="history__opponent" href={`/card/${entry.opponent}`}>
                {truncateAddress(entry.opponent)}
              </Link>

              {entry.roundsPlayed > 0 && (
                <span className="history__score mono">
                  {entry.roundsWon}–{entry.roundsPlayed - entry.roundsWon}
                </span>
              )}

              <span className="history__date mono">{entry.dateUtc}</span>

              <Link
                className="history__replay"
                href={`/battle/${wallet}/${entry.opponent}${entry.nonce ? `?n=${entry.nonce}` : ""}`}
              >
                Replay clash
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
