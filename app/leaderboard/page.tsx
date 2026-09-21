import type { Metadata } from "next";
import Link from "next/link";
import { FightButton } from "@/components/FightButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { loadLeaderboard } from "@/lib/server/leaderboard";
import { paletteFor } from "@/lib/art/palettes";
import { truncateAddress, ordinal } from "@/lib/utils/format";
import type { LeaderboardEntry } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rankings",
  description: "The strongest cards and fiercest arena records. Power earns rank. Wealth never does.",
};

const initials = (entry: LeaderboardEntry): string =>
  (entry.ensName ?? entry.address.slice(2)).slice(0, 2).toUpperCase();

function Table({
  title, caption, entries, metric,
}: {
  title: string;
  caption: string;
  entries: LeaderboardEntry[];
  metric: (entry: LeaderboardEntry) => string;
}) {
  return (
    <section>
      <h2 className="display text-[22px] text-[var(--text)]">{title}</h2>
      <p className="mt-1.5 mb-4.5 text-[12px] leading-relaxed text-[#74748a]">{caption}</p>

      {entries.length === 0 ? (
        <p className="py-5 text-[13px] text-[var(--muted)]">
          No legends yet. Forge the first card and claim the top position.
        </p>
      ) : (
        <ol className="seam-grid grid-cols-1">
          {entries.map((entry, index) => {
            const palette = paletteFor(entry.archetype);

            return (
              <li
                key={entry.address}
                className="seam-cell board__row stagger-item"
                style={{ "--i": index } as React.CSSProperties}
              >
                <span className="board__rank mono" aria-label={ordinal(index + 1)}>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <Avatar className="h-8 w-8" style={{ borderColor: palette.accent }}>
                  <AvatarFallback style={{ color: palette.accent }}>
                    {initials(entry)}
                  </AvatarFallback>
                </Avatar>

                <span className="flex min-w-0 flex-col gap-0.5">
                  <Link className="board__name truncate" href={`/card/${entry.address}`}>
                    {entry.ensName ?? truncateAddress(entry.address)}
                  </Link>
                  <Badge
                    variant="outline"
                    className="w-fit border-[var(--line)] text-[8px] text-[#74748a]"
                  >
                    {entry.archetype}
                  </Badge>
                </span>

                <span className="board__metric mono">{metric(entry)}</span>
                <FightButton opponent={entry.address} />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export default async function LeaderboardPage() {
  const { byLevel, byRecord } = await loadLeaderboard();

  return (
    <main className="page">
      <header className="mx-auto mb-12 max-w-[620px] text-center">
        <h1 className="display enter enter-2 text-[clamp(40px,6.5vw,64px)] text-[var(--text)]">
          The rankings
        </h1>
        <p className="enter enter-3 mt-4 text-[14px] leading-relaxed text-[var(--muted)]">
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
