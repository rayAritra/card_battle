import Link from "next/link";
import styles from "@/components/StatePage.module.css";

export default function NotFound() {
  return (
    <main className={`page ${styles.statePage}`}>
      <h1 className={`${styles.statePageTitle} display ${styles.statePageTitleGlitch}`}>
        Nothing was forged here
      </h1>
      <p className={`${styles.statePageCopy} enter enter-2`}>
        This page does not exist, or its legend has moved elsewhere.
      </p>
      <Link className="button enter enter-3" href="/">
        Return to the arena
      </Link>
    </main>
  );
}
