"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { isAddress } from "viem";
import { settingsMessage } from "@/lib/server/settings";

/** The minimal EIP-1193 surface we need. No wallet library required. */
interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

function provider(): Eip1193Provider | null {
  const injected = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  return injected ?? null;
}

type Status =
  | { kind: "idle" }
  | { kind: "working"; note: string }
  | { kind: "done"; note: string }
  | { kind: "error"; note: string };

/**
 * Signature-authorised privacy controls.
 *
 * The wallet signs the exact text the server will verify, so what the user
 * approves in their wallet is what takes effect.
 */
export function SettingsForm() {
  const [hideNetWorth, setHideNetWorth] = useState(false);
  const [noIndex, setNoIndex] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const save = async () => {
    const wallet = provider();
    if (!wallet) {
      setStatus({
        kind: "error",
        note: "No wallet detected. Open this page in a wallet browser or install a browser wallet.",
      });
      return;
    }

    try {
      setStatus({ kind: "working", note: "Connecting your wallet…" });

      const accounts = await wallet.request({ method: "eth_requestAccounts" });
      const address = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : "";

      if (!isAddress(address, { strict: false })) {
        setStatus({ kind: "error", note: "Your wallet did not reveal a valid address." });
        return;
      }

      const issuedAt = Date.now();
      const message = settingsMessage({
        address: address.toLowerCase(),
        hideNetWorth,
        noIndex,
        issuedAt,
      });

      setStatus({ kind: "working", note: "Awaiting your signature…" });

      const signature = await wallet.request({
        method: "personal_sign",
        params: [message, address],
      });

      if (typeof signature !== "string") {
        setStatus({ kind: "error", note: "Your wallet did not return a signature." });
        return;
      }

      setStatus({ kind: "working", note: "Securing your preferences…" });

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: address.toLowerCase(),
          signature,
          hideNetWorth,
          noIndex,
          issuedAt,
        }),
      });

      const payload: unknown = await response.json().catch(() => null);
      const note =
        payload && typeof payload === "object" && "message" in payload
          ? String((payload as { message?: unknown }).message)
          : "Your privacy preferences could not be saved.";

      if (!response.ok) {
        setStatus({ kind: "error", note });
        return;
      }

      setStatus({ kind: "done", note: "Your privacy settings are now active." });
    } catch (error) {
      const note =
        error instanceof Error && error.message.toLowerCase().includes("reject")
          ? "Signature cancelled. Nothing was changed."
          : "We lost contact with your wallet. Try again.";
      setStatus({ kind: "error", note });
    }
  };

  return (
    <div className="settings">
      <label className="settings__row">
        <input
          type="checkbox"
          checked={hideNetWorth}
          onChange={(event) => setHideNetWorth(event.target.checked)}
        />
        <span>
          <strong>Seal the vault</strong>
          <span className="settings__hint">
            Replace the displayed portfolio estimate with ??? everywhere, including shared images.
          </span>
        </span>
      </label>

      <label className="settings__row">
        <input
          type="checkbox"
          checked={noIndex}
          onChange={(event) => setNoIndex(event.target.checked)}
        />
        <span>
          <strong>Leave the rankings</strong>
          <span className="settings__hint">
            Vanish from rankings, search and rival discovery. Direct links to your card still work.
          </span>
        </span>
      </label>

      <motion.button
        type="button"
        className="button"
        onClick={save}
        disabled={status.kind === "working"}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.12 }}
      >
        {status.kind === "working" ? "Securing…" : "Verify and save"}
      </motion.button>

      {status.kind !== "idle" && (
        <p
          className={status.kind === "error" ? "form-error" : "settings__status"}
          role={status.kind === "error" ? "alert" : "status"}
        >
          {status.note}
        </p>
      )}
    </div>
  );
}
