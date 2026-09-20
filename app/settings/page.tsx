import type { Metadata } from "next";
import { SettingsForm } from "@/components/SettingsForm";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Control your card with a free, secure wallet signature.",
  robots: { index: false, follow: true },
};

export default function SettingsPage() {
  return (
    <main className="page state-page">
      <p className="eyebrow">You control the card</p>
      <h1 className="state-page__title display">Privacy without compromise</h1>
      <p className="state-page__copy">
        Prove ownership with a free wallet signature and choose how your card appears. No
        transaction. No gas. No permissions granted.
      </p>

      <SettingsForm />
    </main>
  );
}
