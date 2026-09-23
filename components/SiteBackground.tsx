import styles from "./SiteBackground.module.css";

/** The flat paper backdrop fixed behind every page — not just the homepage —
 * so navigating the site never cuts back to a different white. Rendered once
 * in app/layout.tsx as a sibling of <main>, the same fixed-behind-content
 * pattern the site has always used for its base layer. */
export function SiteBackground() {
  return (
    <div className={styles.siteBg} aria-hidden="true">
      <div className={styles.siteBgGrain} />
    </div>
  );
}
