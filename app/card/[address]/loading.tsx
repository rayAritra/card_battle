import { CardAsideSkeleton } from "@/components/CardAsideSkeleton";
import { CardSkeleton } from "@/components/CardSkeleton";
import styles from "./card-page.module.css";

/**
 * The loading state is the face-down card, not a spinner (§9). The address is
 * not available to a loading file, so the skeleton seeds its art from a
 * constant — the reveal replaces it with the wallet's own art. The aside gets
 * its own skeleton too, so the two-column grid holds its real shape instead
 * of centering the card off to one side with an empty column beside it.
 */
export default function CardLoading() {
  return (
    <main className={`page ${styles.cardPage}`}>
      <CardSkeleton address="0x0000000000000000000000000000000000000000" />
      <aside className={styles.cardAside}>
        <CardAsideSkeleton />
      </aside>
    </main>
  );
}
