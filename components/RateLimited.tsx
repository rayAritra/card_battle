import { AddressInput } from "./AddressInput";

/** The 429 state, themed. A rate limit must never surface as raw JSON. */
export function RateLimited({ perHour, retryAt }: { perHour: number; retryAt: number }) {
  const minutes = Math.max(1, Math.ceil((retryAt - Date.now()) / 60_000));

  return (
    <main className="page state-page">
      <p className="eyebrow">Cooling</p>
      <h1 className="state-page__title display">The forge is hot</h1>
      <p className="state-page__copy">
        {perHour} cards an hour, per visitor. Try again in about {minutes} minute
        {minutes === 1 ? "" : "s"} — the cards already generated are still there.
      </p>
      <AddressInput cta="Try anyway" examples={[]} />
    </main>
  );
}
