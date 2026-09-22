import "./BattleCard.css";
import "./CardSkeleton.css";

/**
 * The loading state is a face-down card, never a spinner (§9).
 *
 * Mirrors the real card's own DOM structure (BattleCard.tsx) rather than
 * inventing its own layout — same classes, same container-query sizing — so
 * every placeholder block sits exactly where its real counterpart will land
 * and the reveal causes no layout shift. Every block is neutral gray; the
 * archetype accent color isn't known yet.
 */
export function CardSkeleton() {
  return (
    <div className="w-[min(100%,380px)] mx-auto overflow-visible">
      <div className="battle-card rarity--common" aria-hidden style={{ "--accent": "#5a5a5a" } as React.CSSProperties}>
        <div className="battle-card__inner">
          <div className="card-head">
            <div className="card-head-left">
              <span className="card-head-tags">
                <span className="skeleton-line" style={{ width: "18cqw", height: "5cqw", borderRadius: 999 }} />
                <span className="skeleton-line" style={{ width: "14cqw", height: "5cqw", borderRadius: "1.4cqw", animationDelay: "0.08s" }} />
              </span>
              <span className="skeleton-line" style={{ width: "60%", height: "2.3cqw", animationDelay: "0.16s" }} />
            </div>
            <div className="skeleton-line" style={{ width: "12cqw", height: "12cqw", borderRadius: "50%", flexShrink: 0, marginTop: "-1.4cqw", marginBottom: "-3cqw", animationDelay: "0.24s" }} />
          </div>

          <div className="card-art">
            <div className="skeleton-line" style={{ width: "100%", height: "100%", borderRadius: 0, animationDelay: "0.1s" }} />
          </div>

          <div className="card-body">
            <div className="skeleton-line" style={{ width: "72%", height: "7cqw", marginTop: "1.6cqw", animationDelay: "0.2s" }} />
            <div className="skeleton-line" style={{ width: "90%", height: "2.4cqw", marginTop: "1.4cqw", animationDelay: "0.28s" }} />

            <div className="card-vitals">
              <div className="vital">
                <span className="skeleton-line" style={{ width: "5.2cqw", height: "5.2cqw", borderRadius: "1.4cqw", flexShrink: 0, animationDelay: "0.34s" }} />
                <span className="vital__text" style={{ width: "100%" }}>
                  <span className="skeleton-line" style={{ width: "40%", height: "1.9cqw", animationDelay: "0.4s" }} />
                  <span className="skeleton-line" style={{ width: "55%", height: "3.9cqw", marginTop: "0.4cqw", animationDelay: "0.46s" }} />
                </span>
              </div>
            </div>

            <div className="skeleton-line" style={{ width: "30%", height: "1.8cqw", marginBottom: "0.9cqw", animationDelay: "0.52s" }} />

            <div className="stat-list">
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} className="stat-box" style={{ padding: "0.85cqw 1.9cqw" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.6cqw" }}>
                    <span className="skeleton-line" style={{ width: "4.4cqw", height: "4.4cqw", borderRadius: "1.2cqw", flexShrink: 0, animationDelay: `${0.58 + row * 0.06}s` }} />
                    <span className="skeleton-line" style={{ width: `${52 - row * 4}%`, height: "2.1cqw", animationDelay: `${0.62 + row * 0.06}s` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="ability" style={{ marginTop: "1.6cqw" }}>
              <div className="skeleton-line" style={{ width: "34%", height: "1.7cqw", animationDelay: "0.94s" }} />
              <div className="skeleton-line" style={{ width: "50%", height: "3cqw", marginTop: "0.9cqw", animationDelay: "1s" }} />
              <div className="skeleton-line" style={{ width: "80%", height: "2cqw", marginTop: "0.6cqw", animationDelay: "1.06s" }} />
            </div>

            <div className="card-foot">
              <span className="skeleton-line" style={{ width: "30%", height: "2cqw", animationDelay: "1.12s" }} />
              <span className="skeleton-line" style={{ width: "24%", height: "2cqw", animationDelay: "1.16s" }} />
            </div>
          </div>

          <div className="card-skeleton-shimmer" aria-hidden />
        </div>
      </div>
    </div>
  );
}
