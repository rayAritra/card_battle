import type { Metadata } from "next";
import Link from "next/link";
import { FightButton } from "@/components/FightButton";
import { loadLeaderboard } from "@/lib/server/leaderboard";
import { truncateAddress, ordinal } from "@/lib/utils/format";
import type { LeaderboardEntry } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rankings",
  description: "The strongest cards and fiercest arena records. Power earns rank. Wealth never does.",
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
          No legends yet. Forge the first card and claim the top position.
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
              <FightButton opponent={entry.address} />
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
        <p className="eyebrow">Hall of legends</p>
        <h1 className="board-head__title display">The rankings</h1>
        <p className="board-head__copy">
          The strongest wallets rise through power and arena performance. Portfolio size buys no
          glory here.
        </p>
      </header>

      <div className="boards">
        <Table
          title="Power rankings"
          caption="The highest-rated cards across all five onchain powers."
          entries={byLevel}
          metric={(entry) => `LVL ${entry.level}`}
        />
        <Table
          title="Arena champions"
          caption="The fiercest win records from every clash fought so far."
          entries={byRecord}
          metric={(entry) => `${entry.wins}W ${entry.losses}L`}
        />
      </div>
    </main>
  );
}
