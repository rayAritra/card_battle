import type { Metadata } from "next";
import Link from "next/link";
import { loadLeaderboard } from "@/lib/server/leaderboard";
import { truncateAddress, ordinal } from "@/lib/utils/format";
import type { LeaderboardEntry } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "The highest-level cards and the best win records. Never ranked by net worth.",
};

function Table({
  title, caption, entries, metric,
}: {
  title: string;
  caption: string;
  entries: LeaderboardEntry[];
  metric: (entry: LeaderboardEntry) => string;
}) {
  return (
    <section className="board">
      <h2 className="board__title display">{title}</h2>
      <p className="board__caption">{caption}</p>

      {entries.length === 0 ? (
        <p className="board__empty">
          Nothing here yet. Generate the first card and it will appear.
        </p>
      ) : (
        <ol className="board__list">
          {entries.map((entry, index) => (
            <li key={entry.address}>
              <span className="board__rank mono" aria-label={ordinal(index + 1)}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <Link className="board__name" href={`/card/${entry.address}`}>
                {entry.ensName ?? truncateAddress(entry.address)}
              </Link>
              <span className="board__archetype">{entry.archetype}</span>
              <span className="board__metric mono">{metric(entry)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function LeaderboardPage() {
  const { byLevel, byRecord } = await loadLeaderboard();

  return (
    <main className="page">
      <header className="board-head">
        <p className="eyebrow">Standings</p>
        <h1 className="board-head__title display">Leaderboard</h1>
        <p className="board-head__copy">
          Two rankings, and only two. There is no net-worth ranking here and there will not be one —
          how much a wallet holds is not an achievement.
        </p>
      </header>

      <div className="boards">
        <Table
          title="Highest level"
          caption="Weighted across all five stats, with experience carrying the most."
          entries={byLevel}
          metric={(entry) => `LVL ${entry.level}`}
        />
        <Table
          title="Best record"
          caption="Wins and losses across every battle fought so far."
          entries={byRecord}
          metric={(entry) => `${entry.wins}W ${entry.losses}L`}
        />
      </div>
    </main>
  );
}
