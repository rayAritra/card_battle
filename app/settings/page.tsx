import type { Metadata } from "next";
import { SettingsForm } from "@/components/SettingsForm";

export const metadata: Metadata = {
  title: "Settings",
  description: "Control how your card is presented. Changes are authorised by a wallet signature.",
  robots: { index: false, follow: true },
};

export default function SettingsPage() {
  return (
    <main className="page state-page">
      <p className="eyebrow">Your card</p>
      <h1 className="state-page__title display">Settings</h1>
      <p className="state-page__copy">
        These controls apply to the card for your own wallet. Because anyone can look up any
        address, the only way to prove a card is yours is to sign a message with it — signing is
        free and sends no transaction.
      </p>

      <SettingsForm />
    </main>
  );
}
