import { CardAsideSkeleton } from "@/components/CardAsideSkeleton";
import { CardSkeleton } from "@/components/CardSkeleton";
import styles from "./card-page.module.css";

/**
 * The loading state is the face-down card, not a spinner (§9). It's a
 * generic shimmer skeleton, not seeded from the address — the reveal swaps
 * it wholesale for the wallet's own card. The aside gets its own skeleton
 * too, so the two-column grid holds its real shape instead of centering the
 * card off to one side with an empty column beside it.
 */
export default function CardLoading() {
  return (
    <main className={`page ${styles.cardPage}`}>
      <CardSkeleton />
      <aside className={styles.cardAside}>
        <CardAsideSkeleton />
      </aside>
    </main>
  );
}
