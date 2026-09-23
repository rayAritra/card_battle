import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { Badge } from "@/components/ui/badge";
import { paletteFor } from "@/lib/art/palettes";
import { taglineFor } from "@/lib/flavor/templates";
import { ARCHETYPE_CENTROIDS } from "@/lib/stats/archetypes";
import { STAT_KEYS, type StatKey } from "@/types";
import { ArrowLeftRight, Flame, History, Layers, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
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
const STAT_ICONS: Record<
  StatKey,
  React.ComponentType<{ className?: string }>
> = {
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
          Every card is classified as one of {archetypes.length} archetypes by
          finding the closest match to its five stats. The bars below are each
          archetype&rsquo;s ideal shape — the pattern a wallet is measured
          against, not a threshold it has to clear.
        </p>
      </header>

      <div
        className={`${styles.archetypeGrid} mt-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`}
      >
        {archetypes.map(([name, centroid], index) => {
          const palette = paletteFor(name);
          const ranked = STAT_KEYS.map((key, statIndex) => ({
            key,
            statIndex,
            weight: centroid[statIndex] ?? 0,
          })).sort((a, b) => b.weight - a.weight);
          const top = ranked.slice(0, 2);
          const lead = leadStat(centroid) as StatKey;
          const LeadIcon = STAT_ICONS[lead];

          const statPoints = STAT_KEYS.map((key, statIndex) => {
            const weight = centroid[statIndex] ?? 0;
            const x = 22 + statIndex * 54;
            const y = Math.round(64 - weight * 48);
            return { key, statIndex, weight, x, y };
          });

          return (
            <LiquidGlassCard
              key={name}
              borderRadius={28}
              tintColor={palette.accent}
              tintOpacity={0.16}
              interactive={true}
              className={`${styles.archetypeCard} stagger-item flex flex-col gap-4 p-6`}
              style={
                {
                  "--accent": palette.accent,
                  "--i": index,
                } as React.CSSProperties
              }
            >
              <div className={styles.archetypeCardHead}>
                <span className={styles.archetypeCardIcon} aria-hidden="true">
                  <LeadIcon className="h-4 w-4" />
                </span>
                <h2 className="display text-[19px] text-[var(--text)]">
                  {name}
                </h2>
                <Badge
                  variant="outline"
                  className="ml-auto border-[var(--line-strong)] bg-white/40 text-[var(--muted)]"
                >
                  {lead}-led
                </Badge>
              </div>

              <p className="text-[12px] leading-relaxed text-[var(--muted)]">
                {taglineFor(name)}
              </p>

              <div className={styles.archetypeCardHighlights}>
                {top.map(({ key, weight }) => (
                  <div key={key} className={styles.archetypeCardHighlight}>
                    <span className={styles.archetypeCardHighlightLabel}>
                      {key}
                    </span>
                    <span
                      className={`${styles.archetypeCardHighlightValue} mono`}
                    >
                      {Math.round(weight * 100)}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto grid gap-3">
                <p className={styles.archetypeCardBreakdownTitle}>Stat shape</p>

                <div className={styles.archetypeCardGraph} aria-hidden="true">
                  <svg
                    viewBox="0 0 260 76"
                    className={styles.archetypeCardGraphSvg}
                    preserveAspectRatio="none"
                  >
                    <line
                      x1="16"
                      y1="68"
                      x2="244"
                      y2="68"
                      stroke="rgba(23, 21, 15, 0.08)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />

                    {/* Gradient lines merging colors between dots */}
                    {statPoints.slice(0, -1).map((p1, pIdx) => {
                      const p2 = statPoints[pIdx + 1];
                      const gradId = `archetype-grad-${index}-${pIdx}`;
                      return (
                        <g key={gradId}>
                          <defs>
                            <linearGradient
                              id={gradId}
                              x1={p1.x}
                              y1={p1.y}
                              x2={p2.x}
                              y2={p2.y}
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop
                                offset="0%"
                                stopColor={STAT_COLORS[p1.key]}
                              />
                              <stop
                                offset="100%"
                                stopColor={STAT_COLORS[p2.key]}
                              />
                            </linearGradient>
                          </defs>
                          <line
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke={`url(#${gradId})`}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </g>
                      );
                    })}

                    {/* Faint vertical drop guides where bars used to end */}
                    {statPoints.map((p) => (
                      <line
                        key={`guide-${p.key}`}
                        x1={p.x}
                        y1={p.y + 4}
                        x2={p.x}
                        y2={68}
                        stroke={STAT_COLORS[p.key]}
                        strokeWidth="1"
                        strokeDasharray="2 3"
                        opacity="0.3"
                      />
                    ))}

                    {/* Peak dots with distinct metric colors */}
                    {statPoints.map((p) => (
                      <g key={`dot-${p.key}`}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="7"
                          fill={STAT_COLORS[p.key]}
                          opacity="0.25"
                        />
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="4.5"
                          fill={STAT_COLORS[p.key]}
                          stroke="#ffffff"
                          strokeWidth="1.75"
                        />
                      </g>
                    ))}
                  </svg>
                </div>

                <dl className={styles.archetypeCardBreakdown}>
                  {ranked.map(({ key, weight }) => (
                    <div
                      key={key}
                      className={styles.archetypeCardBreakdownItem}
                    >
                      <span
                        className={styles.archetypeCardBreakdownDot}
                        style={
                          {
                            "--bubble-color": STAT_COLORS[key],
                          } as React.CSSProperties
                        }
                      />
                      <dt>{key}</dt>
                      <dd className="mono">{Math.round(weight * 100)}%</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </LiquidGlassCard>
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
