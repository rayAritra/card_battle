import { AddressInput } from "./AddressInput";
import styles from "./StatePage.module.css";

/** The 429 state, themed. A rate limit must never surface as raw JSON. */
export function RateLimited({ perHour, retryAt }: { perHour: number; retryAt: number }) {
  const minutes = Math.max(1, Math.ceil((retryAt - Date.now()) / 60_000));

  return (
    <main className={`page ${styles.statePage}`}>
      <h1 className={`${styles.statePageTitle} display enter enter-1`}>
        Even legends need a moment
      </h1>
      <p className={`${styles.statePageCopy} enter enter-2`}>
        The forge has reached its current limit of {perHour} entries per hour. It reopens in about
        {" "}{minutes} minute{minutes === 1 ? "" : "s"}. Every legend already forged remains waiting.
      </p>
      <AddressInput id="address-ratelimited" cta="Return to the forge" examples={[]} />
    </main>
  );
}
