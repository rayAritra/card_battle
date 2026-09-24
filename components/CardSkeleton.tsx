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
      <div
        className="battle-card rarity--common"
        aria-hidden
        style={
          {
            "--accent": "#c9c3b3",
            "--accent-soft": "#e7e2d2",
            "--glow": "#c9c3b3",
          } as React.CSSProperties
        }
      >
        <div className="battle-card__inner">
          <div className="card-body">
            <div className="skeleton-line" style={{ width: "70%", height: "7.6cqw", animationDelay: "0.1s" }} />
            <div className="skeleton-line" style={{ width: "88%", height: "2.5cqw", marginTop: "1.4cqw", animationDelay: "0.18s" }} />

            <div className="card-vitals">
              <div className="vital-box">
                <span className="skeleton-line" style={{ width: "50%", height: "1.8cqw" }} />
                <span className="skeleton-line" style={{ width: "40%", height: "5.6cqw", marginTop: "0.6cqw", animationDelay: "0.06s" }} />
              </div>
              <div className="vital-box">
                <span className="skeleton-line" style={{ width: "60%", height: "1.8cqw", animationDelay: "0.12s" }} />
                <span className="skeleton-line" style={{ width: "35%", height: "5.6cqw", marginTop: "0.6cqw", animationDelay: "0.18s" }} />
              </div>
            </div>

            <div className="stat-list">
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} className="stat-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "1.6cqw" }}>
                    <span
                      className="skeleton-line"
                      style={{ width: "20cqw", height: "2.1cqw", flexShrink: 0, animationDelay: `${0.4 + row * 0.06}s` }}
                    />
                    <span
                      className="skeleton-line"
                      style={{ flex: 1, height: "2px", borderRadius: "2px", animationDelay: `${0.44 + row * 0.06}s` }}
                    />
                    <span
                      className="skeleton-line"
                      style={{ width: "8cqw", height: "2.3cqw", flexShrink: 0, animationDelay: `${0.48 + row * 0.06}s` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="ability">
              <div style={{ display: "flex", alignItems: "center", gap: "1.2cqw" }}>
                <span className="skeleton-line" style={{ width: "42%", height: "2.9cqw", animationDelay: "0.9s" }} />
                <span className="skeleton-line" style={{ width: "18%", height: "1.6cqw", animationDelay: "0.94s" }} />
              </div>
              <div className="skeleton-line" style={{ width: "78%", height: "2.2cqw", marginTop: "0.7cqw", animationDelay: "1s" }} />
            </div>

            <div className="card-foot">
              <span className="skeleton-line" style={{ width: "42%", height: "1.9cqw", animationDelay: "1.08s" }} />
              <span className="skeleton-line" style={{ width: "16%", height: "1.9cqw", animationDelay: "1.12s" }} />
            </div>
          </div>

          <div className="card-skeleton-shimmer" aria-hidden />
        </div>
      </div>
    </div>
  );
}
