"use client";

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { BattleResult, Card, RoundLog } from "@/types";
import { paletteFor } from "@/lib/art/palettes";
import { truncateAddress } from "@/lib/utils/format";
import { BattleCard } from "./BattleCard";

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
  // white flash, so a win reads as a hit rather than a number changing.
  const [arenaScope, animateArena] = useAnimate();
  const [flashScope, animateFlash] = useAnimate();

  useEffect(() => {
    if (reduced || settled || visibleRounds === 0) return;
    animateArena(arenaScope.current, { x: [0, -6, 6, -3, 3, 0] }, { duration: 0.32, ease: "easeOut" });
    animateFlash(flashScope.current, { opacity: [0.28, 0] }, { duration: 0.35, ease: "easeOut" });
    // Fires once per round change; the animate() functions are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleRounds]);

  const scoreFor = (address: string) =>
    result.rounds.slice(0, visibleRounds).filter((round) => round.winner === address).length;

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
    <div className="replay">
      <div className="replay__arena" ref={arenaScope}>
        <div className="replay__flash" ref={flashScope} style={{ opacity: 0 }} aria-hidden />

        <motion.div
          className="replay__side"
          initial={reduced ? false : { x: -80, opacity: 0, rotateY: 0 }}
          animate={{ x: 0, rotateY: 6, ...cardState(first) }}
          transition={{ duration: reduced ? 0.12 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <BattleCard card={first} animate={false} interactive={false} />
          <Scoreboard
            card={first}
            score={scoreFor(first.address)}
            total={result.rounds.length}
          />
          {settled && first.address === result.winner && (
            <motion.div
              className="replay__victory-burst"
              style={{ "--glow": paletteFor(first.archetype).glow } as React.CSSProperties}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.9, 0.5], scale: [0.6, 1.3, 1.15] }}
              transition={{ duration: reduced ? 0.15 : 1, ease: "easeOut" }}
              aria-hidden
            />
          )}
        </motion.div>

        <div className="replay__center">
          <AnimatePresence mode="wait">
            {phase === "entrance" && (
              <motion.div
                key="vs"
                className="replay__intro"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <span className="replay__intro-mark display">VS</span>
                <span className="replay__intro-names">
                  <span className="mono">{first.ensName ?? truncateAddress(first.address)}</span>
                  <span>×</span>
                  <span className="mono">{second.ensName ?? truncateAddress(second.address)}</span>
                </span>
              </motion.div>
            )}

            {current && !settled && (
              <motion.div
                key={`${visibleRounds}-${current.category}`}
                className="replay__category display"
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
              className="replay__rolls mono"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
            >
              <span>{current.statA}</span>
              <RollDelta value={current.rollA - current.statA} />
              <span className="replay__vs">vs</span>
              <RollDelta value={current.rollB - current.statB} />
              <span>{current.statB}</span>
            </motion.div>
          )}

          {settled && (
            <motion.div
              className="replay__verdict display"
              initial={reduced ? false : { scale: 1.25, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: reduced ? 0.12 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              Arena victory
              <span className="replay__verdict-name">
                {(result.winner === cardA.address ? cardA : cardB).archetype}
              </span>
            </motion.div>
          )}

          <div className="replay__pips" aria-label="rounds won">
            {result.rounds.map((round, index) => (
              <motion.span
                key={index}
                className="replay__pip"
                initial={false}
                animate={{
                  backgroundColor:
                    index < visibleRounds
                      ? paletteFor(
                          (round.winner === cardA.address ? cardA : cardB).archetype,
                        ).accent
                      : "rgba(255,255,255,0.12)",
                  scale: index === visibleRounds - 1 && !settled ? 1.35 : 1,
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>

        <motion.div
          className="replay__side"
          initial={reduced ? false : { x: 80, opacity: 0, rotateY: 0 }}
          animate={{ x: 0, rotateY: -6, ...cardState(second) }}
          transition={{ duration: reduced ? 0.12 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <BattleCard card={second} animate={false} interactive={false} />
          <Scoreboard
            card={second}
            score={scoreFor(second.address)}
            total={result.rounds.length}
          />
          {settled && second.address === result.winner && (
            <motion.div
              className="replay__victory-burst"
              style={{ "--glow": paletteFor(second.archetype).glow } as React.CSSProperties}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.9, 0.5], scale: [0.6, 1.3, 1.15] }}
              transition={{ duration: reduced ? 0.15 : 1, ease: "easeOut" }}
              aria-hidden
            />
          )}
        </motion.div>
      </div>

      {/* An ability banner sweeps across whenever one fires. */}
      <AnimatePresence>
        {current && current.abilitiesTriggered.length > 0 && !settled && (
          <motion.div
            key={`ability-${visibleRounds}`}
            className="replay__ability display"
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: "0%", opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
              Ability activated · {current.abilitiesTriggered.join(" · ")}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="replay__after"
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: settled ? 1 : 0, y: settled ? 0 : 8 }}
        transition={{ duration: 0.4, delay: settled ? 0.2 : 0 }}
        aria-hidden={!settled}
      >
        <p className="replay__commentary">{commentary}</p>
        {children}
      </motion.div>

      <ol className="replay__log">
        {result.rounds.slice(0, visibleRounds).map((round, index) => {
          const winnerCard = round.winner === cardA.address ? cardA : cardB;
          return (
            <li key={index}>
              <span className="replay__log-round mono">R{index + 1}</span>
              <span className="replay__log-category">{BATTLE_CATEGORY_NAMES[round.category]}</span>
              <span className="mono">
                {round.rollA} — {round.rollB}
              </span>
              <span className="replay__log-winner">
                {winnerCard.ensName ?? truncateAddress(winnerCard.address)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function RollDelta({ value }: { value: number }) {
  return (
    <motion.span
      className="replay__delta"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.3 }}
      style={{ color: value >= 0 ? "#6ee7a8" : "#ff6579" }}
    >
      {value >= 0 ? `+${value}` : value}
    </motion.span>
  );
}

function Scoreboard({ card, score, total }: { card: Card; score: number; total: number }) {
  return (
    <div className="replay__score">
      <span className="replay__score-name">{card.ensName ?? truncateAddress(card.address)}</span>
      <span className="mono">
        {score}/{total}
      </span>
    </div>
  );
}
