"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { BattleResult, Card, RoundLog } from "@/types";
import { cardArtDataUri } from "@/lib/art/generate";
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

// Stable array references (not recreated per render) for the flip crossfade
// below — Framer Motion treats a fresh array literal as a fresh target and
// would otherwise risk restarting the keyframe animation on every re-render
// during the merge stage.
const FLIP_FACE_OPACITY = [1, 1, 0, 0, 1];
const FLIP_BACK_OPACITY = [0, 0, 1, 0, 0];
const FLIP_OPACITY_TIMES = [0, 0.42, 0.5, 0.58, 1];

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

  const winnerCard = result.winner === cardA.address ? cardA : cardB;
  // The overall match winner's roll and its opponent's roll for a given
  // round — keyed to `result.winner` (the match), not `round.winner` (that
  // round alone), so a round the winner actually lost still shows its own
  // (lower) roll first rather than borrowing the round-winner's.
  const matchWinnerRoll = (round: RoundLog) => (result.winner === cardA.address ? round.rollA : round.rollB);
  const matchLoserRoll = (round: RoundLog) => (result.winner === cardA.address ? round.rollB : round.rollA);

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

  // The choreographed victory sequence — spin-and-merge at center, then the
  // winner slides left and the win breakdown appears — is a progressive
  // enhancement on top of the plain settle (scale + desaturate) below.
  // Reduced motion always gets the plain settle, so this stage is never
  // entered for those users and the merge/recap markup below never mounts.
  const [resultStage, setResultStage] = useState<"merge" | "recap">(() => (reduced ? "recap" : "merge"));
  const showMerge = settled && !reduced;

  useEffect(() => {
    if (!settled || reduced) return;
    setResultStage("merge");
    const timer = window.setTimeout(() => setResultStage("recap"), 1000);
    return () => window.clearTimeout(timer);
  }, [settled, reduced]);

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

  /**
   * Position/rotation for a side during the merge/recap choreography. `x`/`y`
   * are percentages of the card's own box (Framer Motion's convention), not
   * of the arena — cheap to compute, and precise pixel centering isn't worth
   * the extra measurement machinery for a one-off flourish.
   *
   * The spin is a horizontal flip (`rotateY`), like a coin turned edge-on and
   * over — landing on a full-turn multiple of 360 so the card always ends up
   * facing the viewer. `backface-visibility: hidden` on the face/back pair
   * below (the same pairing RevealSequence uses for its own flip) is set as a
   * defensive baseline, but doesn't reliably hide the front face through
   * BattleCard's own nested `container-type`/`transform-style` — the mirrored
   * text was still visible mid-flip in testing. What actually prevents it is
   * the explicit opacity crossfade on the face/back pair (FLIP_FACE_OPACITY /
   * FLIP_BACK_OPACITY below), timed to the same duration as this rotateY
   * sweep: the front fades out just before the card goes edge-on and the back
   * fades in, regardless of how the 3D rendering resolves.
   *
   * Merge: both cards flip in and overlap at the arena's center, the winner
   * on top at full strength, the loser scaled down, dimmed and peeking out
   * from behind (a small residual `rotate` — the in-plane axis — gives it a
   * tilted, shoved-aside look once it lands). Recap: the winner settles on
   * the left facing forward (regardless of which side it started on) while
   * the loser fades away entirely, clearing the right side for the
   * win-breakdown list.
   */
  const resultTransform = (card: Card) => {
    const isWinner = card.address === result.winner;
    const isFirstSlot = card.address === first.address;
    const sign = isFirstSlot ? 1 : -1;

    if (resultStage === "merge") {
      if (isWinner) {
        return {
          x: `${sign * 92}%`,
          y: "0%",
          rotate: 0,
          rotateY: sign * 360,
          scale: 1.1,
          opacity: 1,
          filter: "saturate(1)",
          zIndex: 5,
        };
      }
      return {
        x: `${sign * 86}%`,
        y: "4%",
        rotate: sign * -7, // the peek tilt it lands on, shoved aside behind the winner
        rotateY: sign * 360,
        scale: 0.8,
        opacity: 0.5,
        filter: "saturate(0.2) brightness(0.75)",
        zIndex: 2,
      };
    }

    // recap — the winner holds its landed flip (no new spin) while it slides
    // left; the loser is invisible by now, so its rotation is moot.
    if (isWinner) {
      return {
        x: isFirstSlot ? "14%" : "-186%",
        y: "0%",
        rotate: 0,
        rotateY: sign * 360,
        scale: 1,
        opacity: 1,
        filter: "saturate(1)",
        zIndex: 5,
      };
    }
    return {
      x: `${sign * 86}%`,
      y: "4%",
      rotate: sign * -7,
      rotateY: sign * 360,
      scale: 0.7,
      opacity: 0,
      filter: "saturate(0.15) brightness(0.7)",
      zIndex: 1,
    };
  };

  const resultTransition = { duration: resultStage === "merge" ? 0.9 : 0.75, ease: [0.22, 1, 0.36, 1] as const };

  /** Only the winner, and only once it's broken from the merge and settled on
      the left, gets the same hover tilt/foil sheen as the standalone card page —
      the rest of the sequence keeps every card non-interactive so the layout
      transforms above aren't fighting a live pointer-driven tilt. */
  const cardInteractive = (card: Card) =>
    showMerge && resultStage === "recap" && card.address === result.winner;

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
          animate={showMerge ? resultTransform(first) : { x: 0, rotateY: 19, ...cardState(first) }}
          transition={showMerge ? resultTransition : { duration: reduced ? 0.12 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.replayCardStack}>
            <motion.div
              className={styles.replayCardFace}
              animate={showMerge ? { opacity: FLIP_FACE_OPACITY } : { opacity: 1 }}
              transition={
                showMerge
                  ? { duration: resultTransition.duration, times: FLIP_OPACITY_TIMES, ease: "linear" }
                  : { duration: 0.2 }
              }
            >
              <BattleCard card={first} animate={false} interactive={cardInteractive(first)} />
            </motion.div>
            {showMerge && (
              <motion.div
                className={styles.replayCardBack}
                style={{ backgroundImage: `url("${cardArtDataUri(first.address, paletteFor(first.archetype), first.rarity)}")` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: FLIP_BACK_OPACITY }}
                transition={{ duration: resultTransition.duration, times: FLIP_OPACITY_TIMES, ease: "linear" }}
                aria-hidden
              />
            )}
          </div>
          {!showMerge && (
            <Scoreboard
              card={first}
              score={scoreFor(first.address)}
              total={result.rounds.length}
              streak={settled ? 0 : streakFor(first.address)}
            />
          )}
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

          {settled && !showMerge && (
            <motion.div
              className={`${styles.replayVerdict} display`}
              initial={reduced ? false : { scale: 1.25, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: reduced ? 0.12 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              Arena victory
              <span className={styles.replayVerdictName}>{winnerCard.archetype}</span>
            </motion.div>
          )}

          {!showMerge && (
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
          )}
        </div>

        {/* The round breakdown: once the winner has broken from the merge and
            settled on the left, every category appears here, one at a time,
            filling the space its opponent used to occupy — the ones it won
            picked out with its own accent, the ones it lost left plain. */}
        <AnimatePresence>
          {showMerge && resultStage === "recap" && (
            <motion.div
              className={styles.replayRecap}
              style={{ "--accent": paletteFor(winnerCard.archetype).accent } as React.CSSProperties}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className={`${styles.replayRecapTitle} display`}>Round breakdown</span>
              <ul className={styles.replayRecapList}>
                {result.rounds.map((round, index) => {
                  const won = round.winner === result.winner;
                  return (
                    <motion.li
                      key={`${round.category}-${index}`}
                      className={won ? styles.replayRecapWon : styles.replayRecapLost}
                      initial={{ opacity: 0, x: 22, scale: 0.97 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: 0.15 + index * 0.14, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <span className={styles.replayRecapCategory}>
                        {BATTLE_CATEGORY_NAMES[round.category]}
                      </span>
                      <span className={`${styles.replayRecapScore} mono`}>
                        {matchWinnerRoll(round)} – {matchLoserRoll(round)}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className={styles.replaySide}
          initial={reduced ? false : { x: 80, opacity: 0, rotateY: 0 }}
          animate={showMerge ? resultTransform(second) : { x: 0, rotateY: -19, ...cardState(second) }}
          transition={showMerge ? resultTransition : { duration: reduced ? 0.12 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.replayCardStack}>
            <motion.div
              className={styles.replayCardFace}
              animate={showMerge ? { opacity: FLIP_FACE_OPACITY } : { opacity: 1 }}
              transition={
                showMerge
                  ? { duration: resultTransition.duration, times: FLIP_OPACITY_TIMES, ease: "linear" }
                  : { duration: 0.2 }
              }
            >
              <BattleCard card={second} animate={false} interactive={cardInteractive(second)} />
            </motion.div>
            {showMerge && (
              <motion.div
                className={styles.replayCardBack}
                style={{ backgroundImage: `url("${cardArtDataUri(second.address, paletteFor(second.archetype), second.rarity)}")` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: FLIP_BACK_OPACITY }}
                transition={{ duration: resultTransition.duration, times: FLIP_OPACITY_TIMES, ease: "linear" }}
                aria-hidden
              />
            )}
          </div>
          {!showMerge && (
            <Scoreboard
              card={second}
              score={scoreFor(second.address)}
              total={result.rounds.length}
              streak={settled ? 0 : streakFor(second.address)}
            />
          )}
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

        {/* The victory banner: "Arena victory", the winner's archetype, and
            the round pips. A sibling of .replayArena (not nested inside it)
            positioned against the full-height .replayStage instead — the
            arena itself is only as tall as the cards and sits vertically
            centered within that taller stage, so anchoring the banner to the
            arena put it right on top of the merged card. Anchoring it to the
            stage keeps it near the true top of the viewport, clear of the
            card regardless of how the arena ends up sized. */}
        <AnimatePresence>
          {showMerge && (
            <motion.div
              className={styles.replayVerdictBanner}
              initial={{ opacity: 0, y: -16, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -10, x: "-50%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className={`${styles.replayVerdictHeadline} display`}>Arena victory</span>
              <span className={styles.replayVerdictName}>{winnerCard.archetype}</span>
              <div className={styles.replayPips} aria-label="rounds won">
                {result.rounds.map((round, index) => {
                  const roundWinnerCard = round.winner === cardA.address ? cardA : cardB;
                  const palette = paletteFor(roundWinnerCard.archetype);
                  return (
                    <span
                      key={index}
                      className={styles.replayPip}
                      style={{
                        backgroundColor: palette.accent,
                        boxShadow: `0 0 10px 1px color-mix(in srgb, ${palette.glow} 40%, transparent)`,
                      }}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
