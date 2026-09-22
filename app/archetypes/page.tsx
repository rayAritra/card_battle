import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight, Flame, History, Layers, Lock } from "lucide-react";
import { ARCHETYPE_CENTROIDS } from "@/lib/stats/archetypes";
import { paletteFor } from "@/lib/art/palettes";
import { taglineFor } from "@/lib/flavor/templates";
import { Badge } from "@/components/ui/badge";
import { STAT_KEYS, type StatKey } from "@/types";
import styles from "./archetypes.module.css";

/** A fixed color per stat, consistent across every card, so a stat reads the same everywhere. */
const STAT_COLORS: Record<StatKey, string> = {
  experience: "#3B82F6",
  trading: "#22C55E",
  defi: "#F59E0B",
  holding: "#EF4444",
  risk: "#A855F7",
};

/** One icon per stat, standing in for the old plain accent dot on each card. */
const STAT_ICONS: Record<StatKey, React.ComponentType<{ className?: string }>> = {
  experience: History,
  trading: ArrowLeftRight,
  defi: Layers,
  holding: Lock,
  risk: Flame,
};

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

      <div className={`${styles.archetypeGrid} mt-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`}>
        {archetypes.map(([name, centroid], index) => {
          const palette = paletteFor(name);
          const ranked = STAT_KEYS
            .map((key, statIndex) => ({ key, statIndex, weight: centroid[statIndex] ?? 0 }))
            .sort((a, b) => b.weight - a.weight);
          const top = ranked.slice(0, 2);
          const lead = leadStat(centroid) as StatKey;
          const LeadIcon = STAT_ICONS[lead];

          return (
            <div
              key={name}
              className={`${styles.archetypeCard} stagger-item flex flex-col gap-4 p-6`}
              style={{ "--accent": palette.accent, "--i": index } as React.CSSProperties}
            >
              <div className={styles.archetypeCardHead}>
                <span className={styles.archetypeCardIcon} aria-hidden="true">
                  <LeadIcon className="h-4 w-4" />
                </span>
                <h2 className="display text-[19px] text-[var(--accent)]">{name}</h2>
                <Badge
                  variant="outline"
                  className="ml-auto border-[var(--accent)] text-[var(--accent)]"
                >
                  {lead}-led
                </Badge>
              </div>

              <p className="text-[12px] leading-relaxed text-[var(--muted)]">{taglineFor(name)}</p>

              <div className={styles.archetypeCardHighlights}>
                {top.map(({ key, weight }) => (
                  <div key={key} className={styles.archetypeCardHighlight}>
                    <span className={styles.archetypeCardHighlightLabel}>{key}</span>
                    <span className={`${styles.archetypeCardHighlightValue} mono`}>
                      {Math.round(weight * 100)}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto grid gap-3">
                <p className={styles.archetypeCardBreakdownTitle}>Stat shape</p>

                <div className={styles.archetypeCardBubbles} aria-hidden="true">
                  {ranked.map(({ key, weight }) => (
                    <span
                      key={key}
                      className={styles.archetypeCardBubble}
                      style={
                        {
                          "--height": `${28 + weight * 64}px`,
                          "--bubble-color": STAT_COLORS[key],
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>

                <dl className={styles.archetypeCardBreakdown}>
                  {ranked.map(({ key, weight }) => (
                    <div key={key} className={styles.archetypeCardBreakdownItem}>
                      <span
                        className={styles.archetypeCardBreakdownDot}
                        style={{ "--bubble-color": STAT_COLORS[key] } as React.CSSProperties}
                      />
                      <dt>{key}</dt>
                      <dd className="mono">{Math.round(weight * 100)}%</dd>
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
