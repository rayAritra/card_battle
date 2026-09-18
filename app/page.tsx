import { AddressInput } from "@/components/AddressInput";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Generated from real onchain history</p>

        <h1 className="hero__title display">
          Every wallet
          <br />
          is a card
        </h1>

        <p className="hero__copy">
          Paste any EVM address. Get a collectible card with a level, five stats, an archetype and
          one ability — all derived from what that wallet has actually done on Ethereum and Base.
          Then send it into battle.
        </p>

        <AddressInput />

        <ol className="how">
          <li>
            <span className="how__step mono">01</span>
            <span>We read the wallet&rsquo;s history across Ethereum and Base.</span>
          </li>
          <li>
            <span className="how__step mono">02</span>
            <span>Stats are scored against a population baseline, not arbitrary thresholds.</span>
          </li>
          <li>
            <span className="how__step mono">03</span>
            <span>Any two cards fight a deterministic, replayable match.</span>
          </li>
        </ol>
      </section>
    </main>
  );
}
