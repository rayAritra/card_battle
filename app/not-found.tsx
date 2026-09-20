import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page state-page">
      <p className="eyebrow">Lost beyond the chain</p>
      <h1 className="state-page__title display">Nothing was forged here</h1>
      <p className="state-page__copy">
        This page does not exist, or its legend has moved elsewhere.
      </p>
      <Link className="button" href="/">
        Return to the arena
      </Link>
    </main>
  );
}
