import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page state-page">
      <h1 className="state-page__title display state-page__title--glitch">Nothing was forged here</h1>
      <p className="state-page__copy enter enter-2">
        This page does not exist, or its legend has moved elsewhere.
      </p>
      <Link className="button enter enter-3" href="/">
        Return to the arena
      </Link>
    </main>
  );
}
