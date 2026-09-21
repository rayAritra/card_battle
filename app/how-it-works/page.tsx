import type { Metadata } from "next";
import Link from "next/link";
import { AddressInput } from "@/components/AddressInput";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How a wallet becomes a card: which data is read, how the five stats are scored against a population baseline, and how a battle is decided.",
  alternates: { canonical: "/how-it-works" },
};

const STATS = [
  {
    name: "EXPERIENCE",
    measures: "Wallet age, months active, transaction count.",
    note: "Weighted 0.4 / 0.4 / 0.2 — how long and how consistently, more than how much.",
  },
  {
    name: "TRADING",
    measures: "Swaps, distinct tokens, cadence, venue diversity.",
    note: "Counts routed swaps, so one multi-hop route is one swap.",
  },
  {
    name: "DEFI",
    measures: "Protocol breadth multiplied by category coverage, plus depth.",
    note: "Breadth is a multiplier. Six categories beats forty transactions on one contract.",
  },
  {
    name: "HOLDING",
    measures: "Median hold duration, untouched share, restraint, longest hold.",
    note: "Measured from first acquisition of a position.",
  },
  {
    name: "RISK",
    measures: "Memecoin share, leverage, unlabelled contracts, open approvals.",
    note: "Not a warning. RISK maps to damage variance — a high-RISK card swings harder both ways.",
  },
];

/**
 * The credibility page.
 *
 * The product's claim is that every number on a card traces back to something
 * the wallet actually did. That claim needs somewhere to live: without it the
 * stats read as decoration. This page is also the honest place to state the
 * limits, which is why the known gaps are listed rather than hidden.
 */
export default function HowItWorksPage() {
  return (
    <main className="page max-w-[760px]">
      <header className="mx-auto max-w-[620px] text-center">
        <h1 className="display enter enter-2 text-[clamp(36px,6vw,58px)] text-[var(--text)]">
          How it works
        </h1>
        <p className="enter enter-3 mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
          Every number on a card comes from public onchain history. Nothing is invented, nothing is
          guessed, and the same wallet always produces the same card.
        </p>
      </header>

      <section className="prose mt-14 [&_a]:text-[var(--brand)] [&_a]:underline [&_a]:underline-offset-2 [&_em]:not-italic [&_em]:text-[var(--text)] [&_strong]:text-[var(--text)]">
        <h2 className="display mt-10 text-[19px] text-[var(--text)] first:mt-0">1. What gets read</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-[#b6b6c8]">
          Your transactions, token transfers, NFT transfers and current token balances on{" "}
          <strong>Ethereum</strong> and <strong>Base</strong> — all of it already public. No wallet
          connection, no signature and no permission is needed to generate a card, because nothing
          here touches your funds.
        </p>
        <p className="mt-3 text-[14.5px] leading-relaxed text-[#b6b6c8]">
          Only <em>derived metrics</em> survive that step. Raw transaction payloads never reach the
          scoring engine, and the history read is capped at the 3,000 most recent transactions per
          address per chain.
        </p>

        <h2 className="display mt-10 text-[19px] text-[var(--text)]">2. How the five stats are scored</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-[#b6b6c8]">
          Each stat normalizes its signals into a single composite, then maps that through a{" "}
          <strong>percentile table</strong> rather than fixed thresholds. Absolute cutoffs always
          feel arbitrary — is forty swaps a lot? — while percentiles answer the question people
          actually mean: how does this wallet compare to others?
        </p>

        <dl className="mt-5 grid gap-px">
          {STATS.map((stat) => (
            <div
              key={stat.name}
              className="grid grid-cols-[116px_1fr] gap-4 border-b border-[var(--line)] py-3.5"
            >
              <dt className="mono text-[12px] text-[var(--brand)]">{stat.name}</dt>
              <dd className="m-0 grid gap-1">
                <span className="text-[13.5px] leading-snug text-[var(--text)]">{stat.measures}</span>
                <span className="text-[12px] leading-snug text-[#74748a]">{stat.note}</span>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 text-[14.5px] leading-relaxed text-[#b6b6c8]">
          Scores are integers from <strong>12 to 99</strong> — never zero, never a hundred. The
          level is derived from all five, weighted toward EXPERIENCE. Tap any stat on a card to see
          the specific activity behind it.
        </p>

        <h2 className="display mt-10 text-[19px] text-[var(--text)]">3. Archetype, ability and rarity</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-[#b6b6c8]">
          The five stats form a shape, and that shape is matched to the nearest of{" "}
          <Link href="/archetypes">sixteen archetypes</Link>. Separately, the wallet is awarded the
          rarest of <Link href="/abilities">thirty abilities</Link> it qualifies for. Both are
          deterministic: the same history always yields the same result.
        </p>

        <h2 className="display mt-10 text-[19px] text-[var(--text)]">4. How a battle is decided</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-[#b6b6c8]">
          Five rounds. Each round draws a stat category from a weighted distribution in which{" "}
          <em>both</em> cards&rsquo; two best stats are more likely to come up — that is what
          creates upsets and gives a rematch a point. Each side then rolls its stat plus a small
          random swing, abilities apply, and the higher roll takes the round.
        </p>
        <p className="mt-3 text-[14.5px] leading-relaxed text-[#b6b6c8]">
          The match is seeded from both addresses, the UTC date and a rematch number, so{" "}
          <strong>anyone opening the link sees the identical match</strong>. The two addresses are
          sorted before seeding, which means swapping their order cannot change the outcome. A
          rematch increments the number: a different match, equally reproducible.
        </p>

        <h2 className="display mt-10 text-[19px] text-[var(--text)]">5. What this does not do</h2>
        <ul className="mt-3 grid gap-2.5 pl-5 text-[14.5px] leading-relaxed text-[#b6b6c8]">
          <li>
            <strong>No net-worth ranking.</strong> Value is always shown bucketed (&ldquo;$28K&rdquo;),
            never exact, and there is no leaderboard for it. How much a wallet holds is not an
            achievement.
          </li>
          <li>
            <strong>No financial advice, no price predictions, no stakes.</strong> Nothing here
            accepts or pays out value. It is entertainment.
          </li>
          <li>
            <strong>No custody, no permissions.</strong> A signature is requested in exactly one
            place — <Link href="/settings">privacy settings</Link> — to prove you own the wallet
            whose card you are changing. It sends no transaction and grants nothing.
          </li>
        </ul>

        <h2 className="display mt-10 text-[19px] text-[var(--text)]">6. Known limits, stated plainly</h2>
        <ul className="mt-3 grid gap-2.5 pl-5 text-[14.5px] leading-relaxed text-[#b6b6c8]">
          <li>
            Hold durations are measured from first acquisition, not from the last time a position
            was sold to zero and rebought.
          </li>
          <li>
            Memecoin classification uses a curated list plus a naming pattern, so it undercounts
            long-tail tokens with ordinary names.
          </li>
          <li>
            Swaps are inferred from transactions to known DEX contracts, so a swap through an
            unlabelled aggregator is missed.
          </li>
          <li>
            Base history is read from a transfer-level source, so open approvals and
            unlabelled-contract exploration are not counted on Base.
          </li>
        </ul>
      </section>

      <section className="mt-14 border-t-2 border-[var(--line)] pt-8 text-center">
        <h2 className="display text-[26px] text-[var(--text)]">See your own</h2>
        <div className="mt-6">
          <AddressInput id="address-methodology" />
        </div>
      </section>
    </main>
  );
}
