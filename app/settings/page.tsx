import type { Metadata } from "next";
import { SettingsForm } from "@/components/SettingsForm";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Control your card with a free, secure wallet signature.",
  robots: { index: false, follow: true },
};

export default function SettingsPage() {
  return (
    <main className="page mx-auto max-w-[620px] text-center">
      <h1 className="display enter enter-2 mt-3.5 text-[clamp(34px,6vw,58px)] text-[var(--text)]">
        Privacy without compromise
      </h1>
      <p className="enter enter-3 mx-auto mt-4 mb-7 max-w-[480px] text-[15px] leading-relaxed text-[var(--muted)]">
        Prove ownership with a free wallet signature and choose how your card appears. No
        transaction. No gas. No permissions granted.
      </p>

      <SettingsForm />
    </main>
  );
}
