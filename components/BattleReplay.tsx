"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { BattleResult, Card, RoundLog } from "@/types";
import { paletteFor } from "@/lib/art/palettes";
import { truncateAddress } from "@/lib/utils/format";
import { BattleCard } from "./BattleCard";
import styles from "./BattleReplay.module.css";

interface BattleReplayProps {
  cardA: Card;
  cardB: Card;
  result: BattleResult;
  commentary: string;
  children?: React.ReactNode;
}

/** Round beat timings, in ms, from §9. */
const ROUND_MS = 1_400;
const ABILITY_PAUSE_MS = 600;

type Phase = "entrance" | "rounds" | "result";

interface Beat {
  round: RoundLog;
  index: number;
  /** Cumulative ms at which this round starts. */
  at: number;
}

const BATTLE_CATEGORY_NAMES: Record<RoundLog["category"], string> = {
  experience: "Legacy clash",
  trading: "Velocity clash",
  defi: "Protocol clash",
  holding: "Conviction clash",
  risk: "Volatility clash",
};

/**
 * The battle replay.
 *
 * Rounds play out one at a time on a wall-clock schedule computed up front,
 * with an extra pause inserted wherever an ability fires. Everything animated
 * is transform or opacity.
 */
export function BattleReplay({ cardA, cardB, result, commentary, children }: BattleReplayProps) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduced ? "result" : "entrance");
  const [visibleRounds, setVisibleRounds] = useState(reduced ? result.rounds.length : 0);

  // The log is written in canonical address order, so map it back to the two
  // cards by address rather than by position.
  const [first, second] = useMemo(
    () =>
      cardA.address.toLowerCase() <= cardB.address.toLowerCase() ? [cardA, cardB] : [cardB, cardA],
    [cardA, cardB],
  );

  const firstGlow = paletteFor(first.archetype).glow;
  const secondGlow = paletteFor(second.archetype).glow;

  const beats = useMemo<Beat[]>(() => {
    let cursor = 500; // entrance
    return result.rounds.map((round, index) => {
      const at = cursor;
      cursor += ROUND_MS + (round.abilitiesTriggered.length > 0 ? ABILITY_PAUSE_MS : 0);
      return { round, index, at };
    });
  }, [result.rounds]);

  useEffect(() => {
    if (reduced) return;

    const timers = beats.map((beat) =>
      window.setTimeout(() => {
        setPhase("rounds");
        setVisibleRounds(beat.index + 1);
      }, beat.at),
    );

    const last = beats[beats.length - 1];
    const endAt = last.at + ROUND_MS + (last.round.abilitiesTriggered.length > 0 ? ABILITY_PAUSE_MS : 0);
    timers.push(window.setTimeout(() => setPhase("result"), endAt));

    return () => timers.forEach(window.clearTimeout);
  }, [beats, reduced]);

  const settled = phase === "result";
  const current = visibleRounds > 0 ? result.rounds[visibleRounds - 1] : null;

  // Every round result lands with an impact frame: a brief arena jolt plus a
  // flash, so a win reads as a hit rather than a number changing. The flash
  // is tinted with the round winner's own color when an ability fired that
  // round — a plain white hit otherwise — so an ability swing is legible as
  // "special" at a glance, not just from the banner text.
  const [arenaScope, animateArena] = useAnimate();
  const [flashScope, animateFlash] = useAnimate();
  const flashColor =
    current && current.abilitiesTriggered.length > 0
      ? paletteFor((current.winner === cardA.address ? cardA : cardB).archetype).glow
      : "#ffffff";

  useEffect(() => {
    if (reduced || settled || visibleRounds === 0) return;
    animateArena(arenaScope.current, { x: [0, -6, 6, -3, 3, 0] }, { duration: 0.32, ease: "easeOut" });
    animateFlash(flashScope.current, { opacity: [0.28, 0] }, { duration: 0.35, ease: "easeOut" });
    // Fires once per round change; the animate() functions are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleRounds]);

  // A tasteful, archetype-colored confetti burst near the winner the instant
  // the match settles — skipped entirely under reduced motion.
  useEffect(() => {
    if (reduced || !settled) return;
    const winnerIsFirst = result.winner === first.address;
    const winnerGlow = winnerIsFirst ? firstGlow : secondGlow;
    confetti({
      particleCount: 70,
      spread: 68,
      startVelocity: 34,
      gravity: 1.05,
      scalar: 0.85,
      ticks: 150,
      origin: { x: winnerIsFirst ? 0.24 : 0.76, y: 0.5 },
      colors: [winnerGlow, "#ffffff"],
      disableForReducedMotion: true,
    });
    // Fires once when the match settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled]);

  const scoreFor = (address: string) =>
    result.rounds.slice(0, visibleRounds).filter((round) => round.winner === address).length;

  /** Consecutive rounds most recently won by this address, counting back from the latest reveal. */
  const streakFor = (address: string) => {
    let streak = 0;
    for (let i = visibleRounds - 1; i >= 0; i--) {
      if (result.rounds[i].winner !== address) break;
      streak++;
    }
    return streak;
  };

  const cardState = (card: Card) => {
    if (!settled) {
      if (!current) return { scale: 1, opacity: 1, filter: "saturate(1)" };
      const won = current.winner === card.address;
      return {
        scale: won ? 1.02 : 1,
        opacity: won ? 1 : 0.72,
        filter: "saturate(1)",
      };
    }
    const won = result.winner === card.address;
    return {
      scale: won ? 1.06 : 0.98,
      opacity: 1,
      filter: won ? "saturate(1)" : "saturate(0.4)",
    };
  };

  return (
    <div className={styles.replay}>
      {/* The stage centers the arena vertically within roughly the opening */}
      {/* viewport, independent of however tall the commentary/log below turn */}
      {/* out to be — a min-height flex box, not a share of the page's total */}
      {/* content height, so a long round log never flattens the centering. */}
      <div className={styles.replayStage}>
        <div
          className={styles.replayArena}
          ref={arenaScope}
          style={{ "--left-glow": firstGlow, "--right-glow": secondGlow } as React.CSSProperties}
        >
          <div
            className={styles.replayFlash}
            ref={flashScope}
            style={{ opacity: 0, background: flashColor }}
            aria-hidden
          />

        {!reduced && (
          <AnimatePresence>
            {current && visibleRounds > 0 && !settled && (
              <ImpactBurst key={visibleRounds} />
            )}
          </AnimatePresence>
        )}

        <motion.div
          className={styles.replaySide}
          initial={reduced ? false : { x: -80, opacity: 0, rotateY: 0 }}
          animate={{ x: 0, rotateY: 19, ...cardState(first) }}
          transition={{ duration: reduced ? 0.12 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <BattleCard card={first} animate={false} interactive={false} />
          <Scoreboard
            card={first}
            score={scoreFor(first.address)}
            total={result.rounds.length}
            streak={settled ? 0 : streakFor(first.address)}
          />
          {settled && first.address === result.winner && (
            <motion.div
              className={styles.replayVictoryBurst}
              style={{ "--glow": firstGlow } as React.CSSProperties}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.9, 0.5], scale: [0.6, 1.3, 1.15] }}
              transition={{ duration: reduced ? 0.15 : 1, ease: "easeOut" }}
              aria-hidden
            />
          )}
        </motion.div>

        <div className={styles.replayCenter}>
          <AnimatePresence mode="wait">
            {phase === "entrance" && (
              <motion.div
                key="vs"
                className={styles.replayIntro}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <span className={`${styles.replayIntroMark} display`}>VS</span>
                <span className={styles.replayIntroNames}>
                  <span className="mono">{first.ensName ?? truncateAddress(first.address)}</span>
                  <span>×</span>
                  <span className="mono">{second.ensName ?? truncateAddress(second.address)}</span>
                </span>
              </motion.div>
            )}

            {current && !settled && (
              <motion.div
                key={`${visibleRounds}-${current.category}`}
                className={`${styles.replayCategory} display`}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {BATTLE_CATEGORY_NAMES[current.category]}
              </motion.div>
            )}
          </AnimatePresence>

          {current && !settled && (
            <motion.div
              key={`rolls-${visibleRounds}`}
              className={`${styles.replayRolls} mono`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
            >
              <span>{current.statA}</span>
              <RollDelta value={current.rollA - current.statA} />
              <span className={styles.replayVs}>vs</span>
              <RollDelta value={current.rollB - current.statB} />
              <span>{current.statB}</span>
            </motion.div>
          )}

          {settled && (
            <motion.div
              className={`${styles.replayVerdict} display`}
              initial={reduced ? false : { scale: 1.25, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: reduced ? 0.12 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              Arena victory
              <span className={styles.replayVerdictName}>
                {(result.winner === cardA.address ? cardA : cardB).archetype}
              </span>
            </motion.div>
          )}

          <div className={styles.replayPips} aria-label="rounds won">
            {result.rounds.map((round, index) => {
              const roundWinnerCard = round.winner === cardA.address ? cardA : cardB;
              const active = index === visibleRounds - 1 && !settled;
              return (
                <motion.span
                  key={index}
                  className={styles.replayPip}
                  initial={false}
                  animate={{
                    backgroundColor:
                      index < visibleRounds
                        ? paletteFor(roundWinnerCard.archetype).accent
                        : "rgba(255,255,255,0.12)",
                    scale: active ? 1.35 : 1,
                    boxShadow:
                      index < visibleRounds
                        ? `0 0 10px 1px color-mix(in srgb, ${paletteFor(roundWinnerCard.archetype).glow} ${active ? 70 : 0}%, transparent)`
                        : "0 0 0 0 transparent",
                  }}
                  transition={{ duration: 0.3 }}
                />
              );
            })}
          </div>
        </div>

        <motion.div
          className={styles.replaySide}
          initial={reduced ? false : { x: 80, opacity: 0, rotateY: 0 }}
          animate={{ x: 0, rotateY: -19, ...cardState(second) }}
          transition={{ duration: reduced ? 0.12 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <BattleCard card={second} animate={false} interactive={false} />
          <Scoreboard
            card={second}
            score={scoreFor(second.address)}
            total={result.rounds.length}
            streak={settled ? 0 : streakFor(second.address)}
          />
          {settled && second.address === result.winner && (
            <motion.div
              className={styles.replayVictoryBurst}
              style={{ "--glow": secondGlow } as React.CSSProperties}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.9, 0.5], scale: [0.6, 1.3, 1.15] }}
              transition={{ duration: reduced ? 0.15 : 1, ease: "easeOut" }}
              aria-hidden
            />
          )}
        </motion.div>

          {/* An ability banner sweeps across whenever one fires — nested inside
              the arena (not a sibling of the stage) so its position tracks the
              arena's own box, however the stage sizes it. */}
          <AnimatePresence>
            {current && current.abilitiesTriggered.length > 0 && !settled && (
              <motion.div
                key={`ability-${visibleRounds}`}
                className={`${styles.replayAbility} display`}
                style={{ "--ability-color": flashColor } as React.CSSProperties}
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: "0%", opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                  Ability activated · {current.abilitiesTriggered.join(" · ")}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <motion.div
        className={styles.replayAfter}
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: settled ? 1 : 0, y: settled ? 0 : 8 }}
        transition={{ duration: 0.4, delay: settled ? 0.2 : 0 }}
        aria-hidden={!settled}
      >
        <p className={styles.replayCommentary}>{commentary}</p>
        {children}
      </motion.div>

      <ol className={styles.replayLog}>
        {result.rounds.slice(0, visibleRounds).map((round, index) => {
          const winnerCard = round.winner === cardA.address ? cardA : cardB;
          return (
            <li key={index}>
              <span className={`${styles.replayLogRound} mono`}>R{index + 1}</span>
              <span className={styles.replayLogCategory}>{BATTLE_CATEGORY_NAMES[round.category]}</span>
              <span className="mono">
                {round.rollA} — {round.rollB}
              </span>
              <span className={styles.replayLogWinner}>
                {winnerCard.ensName ?? truncateAddress(winnerCard.address)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Angles (degrees) the impact sparks fly out along, evenly spread. */
const SPARK_ANGLES = [15, 55, 95, 135, 175, 215, 255, 295, 335];

/**
 * The clash: two beams race in from each card and meet at center, followed
 * by a shockwave ring and a spray of sparks. Fires once per round, mounted
 * fresh via its `key` so every entrance/exit replays cleanly.
 */
function ImpactBurst() {
  return (
    <motion.div className={styles.replayClash} aria-hidden>
      <motion.span
        className={`${styles.replayBeam} ${styles.replayBeamLeft}`}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: [0, 1, 0] }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.span
        className={`${styles.replayBeam} ${styles.replayBeamRight}`}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: [0, 1, 0] }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.span
        className={styles.replayImpactRing}
        initial={{ scale: 0.3, opacity: 0.9 }}
        animate={{ scale: 1.7, opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      />
      {SPARK_ANGLES.map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const dist = 60 + (angle % 40);
        return (
          <motion.span
            key={angle}
            className={styles.replaySpark}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: Math.cos(rad) * dist,
              y: Math.sin(rad) * dist,
              opacity: 0,
            }}
            transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
          />
        );
      })}
    </motion.div>
  );
}

function RollDelta({ value }: { value: number }) {
  return (
    <motion.span
      className={styles.replayDelta}
      initial={{ opacity: 0, y: -10, scale: 0.4 }}
      animate={{ opacity: 1, y: 0, scale: [1.5, 1] }}
      transition={{ delay: 0.35, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      style={{ color: value >= 0 ? "#6ee7a8" : "#ff6579" }}
    >
      {value >= 0 ? `+${value}` : value}
    </motion.span>
  );
}

function Scoreboard({
  card,
  score,
  total,
  streak,
}: {
  card: Card;
  score: number;
  total: number;
  streak: number;
}) {
  return (
    <div className={styles.replayScore}>
      <span className={styles.replayScoreLevel}>{card.level}</span>
      <span className={styles.replayScoreName}>{card.ensName ?? truncateAddress(card.address)}</span>
      <span className="mono">
        {score}/{total}
      </span>
      <AnimatePresence>
        {streak >= 2 && (
          <motion.span
            className={styles.replayStreak}
            style={{ "--glow": paletteFor(card.archetype).glow } as React.CSSProperties}
            initial={{ opacity: 0, scale: 0.6, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25 }}
          >
            {streak}-streak
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
