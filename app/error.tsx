"use client";

import { useEffect } from "react";
import Link from "next/link";

/** Top-level error boundary. Themed, never a raw stack trace. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "error",
        scope: "ui.boundary",
        message: error.message,
        digest: error.digest,
      }),
    );
  }, [error]);

  return (
    <main className="page state-page">
      <p className="eyebrow">Something broke</p>
      <h1 className="state-page__title display">The chain went quiet</h1>
      <p className="state-page__copy">
        This one is on us. The card was not generated. Try again — cards already made are unaffected.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button type="button" className="button" onClick={reset}>
          Try again
        </button>
        <Link className="button button--ghost" href="/">
          Start over
        </Link>
      </div>
    </main>
  );
}
