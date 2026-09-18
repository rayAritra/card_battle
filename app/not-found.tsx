import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page state-page">
      <p className="eyebrow">404</p>
      <h1 className="state-page__title display">No card here</h1>
      <p className="state-page__copy">
        That page does not exist. Every card lives at /card/ followed by a wallet address.
      </p>
      <Link className="button" href="/">
        Generate a card
      </Link>
    </main>
  );
}
