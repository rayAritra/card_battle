import { AddressInput } from "./AddressInput";

/** The 429 state, themed. A rate limit must never surface as raw JSON. */
export function RateLimited({ perHour, retryAt }: { perHour: number; retryAt: number }) {
  const minutes = Math.max(1, Math.ceil((retryAt - Date.now()) / 60_000));

  return (
    <main className="page state-page">
      <p className="eyebrow">Arena cooldown</p>
      <h1 className="state-page__title display">Even legends need a moment</h1>
      <p className="state-page__copy">
        The forge has reached its current limit of {perHour} entries per hour. It reopens in about
        {" "}{minutes} minute{minutes === 1 ? "" : "s"}. Every legend already forged remains waiting.
      </p>
      <AddressInput cta="Return to the forge" examples={[]} />
    </main>
  );
}
