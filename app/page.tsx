import { AddressInput } from "@/components/AddressInput";
import { RecentCards } from "@/components/RecentCards";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Your history. Your power.</p>

        <h1 className="hero__title display">
          Every wallet has
          <br />
          a legend
        </h1>

        <p className="hero__copy">
          Transform any wallet into a one-of-one battle card, shaped by its trades, holdings,
          protocols, risk and time onchain. Forge your identity, then put it to the test.
        </p>

        <AddressInput />

        <RecentCards />

        <ol className="how">
          <li>
            <span className="how__step mono">01</span>
            <span>SCAN — Uncover the wallet&rsquo;s history across Ethereum and Base.</span>
          </li>
          <li>
            <span className="how__step mono">02</span>
            <span>FORGE — Every action shapes its power, archetype, rarity and ability.</span>
          </li>
          <li>
            <span className="how__step mono">03</span>
            <span>BATTLE — Five rounds. Two wallets. One onchain legend.</span>
          </li>
        </ol>
      </section>
    </main>
  );
}
