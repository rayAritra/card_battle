import type { Metadata } from "next";
import Link from "next/link";
import { ARCHETYPE_CENTROIDS } from "@/lib/stats/archetypes";
import { paletteFor } from "@/lib/art/palettes";
import { taglineFor } from "@/lib/flavor/templates";
import { Badge } from "@/components/ui/badge";
import { STAT_KEYS } from "@/types";

export const metadata: Metadata = {
  title: "Archetypes",
  description:
    "All sixteen archetypes a wallet can be classified as, and the stat shape that produces each one.",
  alternates: { canonical: "/archetypes" },
};

/** The stat with the highest weight in an archetype's centroid — its "lead". */
function leadStat(centroid: readonly number[]): string {
  const topIndex = centroid.reduce(
    (best, value, index) => (value > centroid[best] ? index : best),
    0,
  );
  return STAT_KEYS[topIndex];
}

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
      <header className="mx-auto max-w-[620px] text-center">
        <h1 className="display enter enter-2 text-[clamp(38px,6.5vw,62px)] text-[var(--text)]">
          Archetypes
        </h1>
        <p className="enter enter-3 mt-4 text-[14px] leading-relaxed text-[var(--muted)]">
          Every card is classified as one of {archetypes.length} archetypes by finding the closest
          match to its five stats. The bars below are each archetype&rsquo;s ideal shape — the
          pattern a wallet is measured against, not a threshold it has to clear.
        </p>
      </header>

      <div className="seam-grid mt-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {archetypes.map(([name, centroid], index) => {
          const palette = paletteFor(name);
          const ranked = STAT_KEYS
            .map((key, statIndex) => ({ key, statIndex, weight: centroid[statIndex] ?? 0 }))
            .sort((a, b) => b.weight - a.weight);
          const top = ranked.slice(0, 2);

          return (
            <div
              key={name}
              className="seam-cell archetype-card stagger-item flex flex-col gap-4 p-6"
              style={{ "--accent": palette.accent, "--i": index } as React.CSSProperties}
            >
              <div className="archetype-card__head">
                <span className="archetype-card__dot" aria-hidden="true" />
                <h2 className="display text-[19px] text-[var(--accent)]">{name}</h2>
                <Badge
                  variant="outline"
                  className="ml-auto border-[var(--accent)] text-[var(--accent)]"
                >
                  {leadStat(centroid)}-led
                </Badge>
              </div>

              <p className="text-[12px] leading-relaxed text-[var(--muted)]">{taglineFor(name)}</p>

              <div className="archetype-card__highlights">
                {top.map(({ key, weight }) => (
                  <div key={key} className="archetype-card__highlight">
                    <span className="archetype-card__highlight-label">{key}</span>
                    <span className="archetype-card__highlight-value mono">
                      {Math.round(weight * 100)}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto grid gap-2.5">
                <p className="archetype-card__breakdown-title">Stat shape</p>
                <dl className="grid gap-2">
                  {ranked.map(({ key, statIndex, weight }) => (
                    <div key={key} className="grid grid-cols-[74px_1fr_30px] items-center gap-2.5">
                      <dt className="text-[9px] tracking-wide text-[#74748a]">{key}</dt>
                      <dd className="m-0">
                        <span className="archetype__meter">
                          <span
                            className="archetype__fill"
                            style={
                              {
                                width: `${Math.round(weight * 100)}%`,
                                "--si": statIndex,
                              } as React.CSSProperties
                            }
                          />
                        </span>
                      </dd>
                      <dd className="m-0 text-right font-mono text-[9px] text-[#797990]">
                        {Math.round(weight * 100)}%
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-center">
        <Link className="button button--ghost" href="/how-it-works">
          How the stats are scored
        </Link>
      </p>
    </main>
  );
}
