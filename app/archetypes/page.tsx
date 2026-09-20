import type { Metadata } from "next";
import Link from "next/link";
import { ARCHETYPE_CENTROIDS } from "@/lib/stats/archetypes";
import { paletteFor } from "@/lib/art/palettes";
import { taglineFor } from "@/lib/flavor/templates";
import { STAT_KEYS } from "@/types";

export const metadata: Metadata = {
  title: "Archetypes",
  description:
    "All sixteen archetypes a wallet can be classified as, and the stat shape that produces each one.",
  alternates: { canonical: "/archetypes" },
};

/**
 * The archetype compendium.
 *
 * A collectible has to be browsable or nobody knows what they are chasing:
 * before this page the only way to discover an archetype was to be assigned it.
 * Everything here is read from the live tables — `ARCHETYPE_CENTROIDS`, the
 * palettes and the taglines — so adding an archetype publishes it here with no
 * edit to this file.
 */
export default function ArchetypesPage() {
  const archetypes = Object.entries(ARCHETYPE_CENTROIDS);

  return (
    <main className="page">
      <header className="board-head">
        <p className="eyebrow">Compendium</p>
        <h1 className="board-head__title display">Archetypes</h1>
        <p className="board-head__copy">
          Every card is classified as one of {archetypes.length} archetypes by finding the closest
          match to its five stats. The bars below are each archetype&rsquo;s ideal shape — the
          pattern a wallet is measured against, not a threshold it has to clear.
        </p>
      </header>

      <ul className="archetypes">
        {archetypes.map(([name, centroid]) => {
          const palette = paletteFor(name);

          return (
            <li
              key={name}
              className="archetype"
              style={{ ["--accent" as string]: palette.accent }}
            >
              <h2 className="archetype__name display">{name}</h2>
              <p className="archetype__tagline">{taglineFor(name)}</p>

              <dl className="archetype__stats">
                {STAT_KEYS.map((key, index) => {
                  const weight = centroid[index] ?? 0;

                  return (
                    <div key={key} className="archetype__stat">
                      <dt>{key}</dt>
                      <dd>
                        <span className="archetype__meter">
                          <span
                            className="archetype__fill"
                            style={{ width: `${Math.round(weight * 100)}%` }}
                          />
                        </span>
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </li>
          );
        })}
      </ul>

      <p className="compendium__foot">
        <Link className="button button--ghost" href="/how-it-works">
          How the stats are scored
        </Link>
      </p>
    </main>
  );
}
