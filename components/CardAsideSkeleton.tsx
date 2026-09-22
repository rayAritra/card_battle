import "./CardSkeleton.css";

/**
 * Mirrors the real <aside> on the card page — claim pill, heading, copy,
 * challenger input, share row, stat row — so the two-column layout holds its
 * shape while the card loads instead of leaving the right column blank.
 */
export function CardAsideSkeleton() {
  return (
    <div className="w-full max-w-[420px]" aria-hidden="true">
      <div className="skeleton-line" style={{ width: 156, height: 26, borderRadius: 999 }} />

      <div className="mt-4.5">
        <div className="skeleton-line" style={{ width: "82%", height: 34, borderRadius: 8, animationDelay: "0.06s" }} />
        <div className="skeleton-line mt-2.5" style={{ width: "52%", height: 34, borderRadius: 8, animationDelay: "0.12s" }} />
      </div>

      <div className="mt-4 grid gap-2">
        <div className="skeleton-line" style={{ height: 11, borderRadius: 4, animationDelay: "0.18s" }} />
        <div className="skeleton-line" style={{ height: 11, width: "92%", borderRadius: 4, animationDelay: "0.24s" }} />
        <div className="skeleton-line" style={{ height: 11, width: "68%", borderRadius: 4, animationDelay: "0.3s" }} />
      </div>

      <div className="mt-7 grid gap-2.5">
        <div className="skeleton-line" style={{ height: 10, width: 132, borderRadius: 4, animationDelay: "0.36s" }} />
        <div className="skeleton-line" style={{ height: 46, borderRadius: 999, animationDelay: "0.42s" }} />
      </div>

      <div className="mt-3 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton-line"
            style={{ height: 38, width: 38, borderRadius: 10, animationDelay: `${0.48 + i * 0.06}s` }}
          />
        ))}
      </div>

      <div className="mt-7 flex flex-wrap gap-6 border-t-2 border-[var(--line)] pt-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid gap-1.5">
            <div
              className="skeleton-line"
              style={{ height: 8, width: 50, borderRadius: 4, animationDelay: `${0.7 + i * 0.06}s` }}
            />
            <div
              className="skeleton-line"
              style={{ height: 13, width: 64, borderRadius: 4, animationDelay: `${0.76 + i * 0.06}s` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
