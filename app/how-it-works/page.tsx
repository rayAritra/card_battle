import { AddressInput } from "@/components/AddressInput";
import {
  AlertTriangle,
  BarChart3,
  Eye,
  Layers,
  ShieldOff,
  Swords,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "./how-it-works.module.css";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How a wallet becomes a card: which data is read, how the five stats are scored against a population baseline, and how a battle is decided.",
  alternates: { canonical: "/how-it-works" },
};

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: React.ReactNode;
  points: React.ReactNode[];
}

const STEPS: Step[] = [
  {
    icon: Eye,
    title: "What gets read",
    description:
      "Your transactions, token transfers, NFT transfers and current balances on Ethereum and Base — all of it already public.",
    points: [
      "No wallet connection or signature is needed to generate a card, because nothing here touches your funds.",
      "Only derived metrics survive scoring — raw transaction payloads never reach the engine.",
      "History is capped at the 3,000 most recent transactions per address per chain.",
    ],
  },
  {
    icon: BarChart3,
    title: "How the five stats are scored",
    description:
      "Each stat normalizes its signals into a composite, then maps that through a percentile table rather than fixed thresholds.",
    points: [
      <span key="exp">
        <strong className="text-[var(--text)]">EXPERIENCE</strong> — wallet age,
        months active, transaction count.
      </span>,
      <span key="trd">
        <strong className="text-[var(--text)]">TRADING</strong> — swaps,
        distinct tokens, cadence, venue diversity.
      </span>,
      <span key="defi">
        <strong className="text-[var(--text)]">DEFI</strong> — protocol breadth
        multiplied by category coverage, plus depth.
      </span>,
      <span key="hold">
        <strong className="text-[var(--text)]">HOLDING</strong> — median hold
        duration, untouched share, restraint.
      </span>,
      <span key="risk">
        <strong className="text-[var(--text)]">RISK</strong> — memecoin share,
        leverage, unlabelled contracts, open approvals.
      </span>,
      "Scores run 12–99, never zero or a hundred — the level weights toward EXPERIENCE.",
    ],
  },
  {
    icon: Layers,
    title: "Archetype, ability and rarity",
    description:
      "The five stats form a shape, and that shape is matched to the nearest archetype. Both outcomes below are deterministic.",
    points: [
      <span key="a">
        Matched to the nearest of{" "}
        <Link href="/archetypes">sixteen archetypes</Link>.
      </span>,
      <span key="b">
        Awarded the rarest of <Link href="/abilities">thirty abilities</Link> it
        qualifies for.
      </span>,
      "The same history always yields the same result.",
    ],
  },
  {
    icon: Swords,
    title: "How a battle is decided",
    description:
      "Five rounds. Each draws a stat category from a weighted distribution favoring both cards' two best stats — that's what creates upsets.",
    points: [
      "Each side rolls its stat plus a small random swing, abilities apply, and the higher roll takes the round.",
      "The match is seeded from both addresses, the UTC date and a rematch number — anyone opening the link sees the identical match.",
      "The two addresses are sorted before seeding, so swapping their order can't change the outcome.",
    ],
  },
  {
    icon: ShieldOff,
    title: "What this does not do",
    description: "The limits are as much a part of the design as the features.",
    points: [
      "No net-worth ranking — value is always bucketed (“$28K”), never exact, and never leaderboarded.",
      "No financial advice, no price predictions, no stakes — this is entertainment.",
      <span key="c">
        No custody, no permissions — a signature is requested only in{" "}
        <Link href="/settings">privacy settings</Link>, to prove ownership. It
        sends no transaction.
      </span>,
    ],
  },
  {
    icon: AlertTriangle,
    title: "Known limits, stated plainly",
    description:
      "Every number traces to something the wallet did — but the trace has edges.",
    points: [
      "Hold durations measure from first acquisition, not from a sell-to-zero and rebuy.",
      "Memecoin classification uses a curated list plus a naming pattern, undercounting long-tail tokens.",
      "Swaps are inferred from known DEX contracts, so unlabelled aggregators are missed.",
      "Base history comes from a transfer-level source, so approvals and unlabelled-contract exploration aren't counted there.",
    ],
  },
];

/**
 * The credibility page.
 *
 * The product's claim is that every number on a card traces back to something
 * the wallet actually did. That claim needs somewhere to live: without it the
 * stats read as decoration. The known gaps are stated rather than hidden.
 */
export default function HowItWorksPage() {
  return (
    <main className="page max-w-[1180px]">
      <header className="mx-auto max-w-[620px] text-center">
        <h1 className="display enter enter-2 text-[clamp(36px,6vw,58px)] text-[var(--text)]">
          How it works
        </h1>
        <p className="enter enter-3 mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
          Every number on a card comes from public onchain history. Nothing is
          invented, nothing is guessed, and the same wallet always produces the
          same card.
        </p>
      </header>

      <div className={`${styles.howGrid} mt-12`}>
        {STEPS.map((step, index) => (
          <section
            key={step.title}
            className={`${styles.howCard} stagger-item`}
            style={{ "--i": index } as React.CSSProperties}
          >
            <div className={styles.howCardHead}>
              <span className={styles.howCardIcon}>
                <step.icon className="h-5 w-5" />
              </span>
              <span className={`${styles.howCardNum} mono`}>
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <h2 className={`display ${styles.howCardTitle}`}>{step.title}</h2>
            <p className={styles.howCardDesc}>{step.description}</p>

            <ul className={styles.howCardList}>
              {step.points.map((point, pointIndex) => (
                <li key={pointIndex}>
                  <span className={styles.howCardDot} aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-16 border-t-2 border-[var(--line)] pt-8 text-center">
        <h2 className="display text-[26px] text-[var(--text)]">See your own</h2>
        <div className="mt-6">
          <AddressInput id="address-methodology" />
        </div>
      </section>
    </main>
  );
}
