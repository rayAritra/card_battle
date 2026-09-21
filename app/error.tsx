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
      <h1 className="state-page__title display state-page__title--glitch">The chain went silent</h1>
      <p className="state-page__copy enter enter-2">
        We could not complete the reveal. Your existing cards and battles are safe.
      </p>
      <div className="enter enter-3" style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button type="button" className="button" onClick={reset}>
          Try again
        </button>
        <Link className="button button--ghost" href="/">
          Return home
        </Link>
      </div>
    </main>
  );
}
