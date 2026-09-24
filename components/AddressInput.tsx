"use client";

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isAddress } from "viem";
import { injectedProvider } from "@/lib/wallet/injected";
import styles from "./AddressInput.module.css";

interface AddressInputProps {
  /**
   * Path prefix the validated address is appended to. A string, not a
   * function: this component is a Client Component, and function props cannot
   * cross the server boundary.
   */
  destinationPrefix?: string;
  label?: string;
  cta?: string;
  /** Override the submit button's classes, e.g. for a page-specific CTA treatment. */
  ctaClassName?: string;
  /** One-tap example wallets. */
  examples?: { label: string; address: string }[];
  /** Override when more than one AddressInput renders on the same page. */
  id?: string;
}

const DEFAULT_EXAMPLES = [
  {
    label: "vitalik.eth",
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  },
  {
    label: "Uniswap deployer",
    address: "0x41653c7d61609D856f29355E404F09f0F9c3901d",
  },
  {
    label: "Base builder",
    address: "0x8c8F1a1e1bFdb15E7ed562efc84e5A588E68aD73",
  },
];

const looksLikeName = (value: string): boolean =>
  value.length > 2 && value.includes(".") && !value.startsWith("0x");

/**
 * The front door. Accepts an address, an ENS name or a basename.
 *
 * Addresses are validated with viem before navigating, so a typo never costs a
 * round trip. Names are resolved through /api/resolve, which is the only case
 * that needs the network — people think in names, so rejecting them outright
 * was losing visitors at the first field.
 */
export function AddressInput({
  destinationPrefix = "/card/",
  label,
  cta = "Forge my card",
  ctaClassName = "button button--accent",
  examples = DEFAULT_EXAMPLES,
  id = "address",
}: AddressInputProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const go = (address: string) => {
    setPending(true);
    router.push(`${destinationPrefix}${address.toLowerCase()}`);
  };

  const connect = async () => {
    const wallet = injectedProvider();
    if (!wallet) {
      setError(
        "No wallet extension detected. Install MetaMask or paste your address instead.",
      );
      return;
    }

    setError(null);
    setConnecting(true);

    try {
      const accounts = await wallet.request({ method: "eth_requestAccounts" });
      const address =
        Array.isArray(accounts) && typeof accounts[0] === "string"
          ? accounts[0]
          : "";

      if (!isAddress(address, { strict: false })) {
        setError("Your wallet did not reveal a valid address.");
        setConnecting(false);
        return;
      }

      setValue(address);
      go(address);
    } catch (err) {
      const note =
        err instanceof Error && err.message.toLowerCase().includes("reject")
          ? "Connection cancelled."
          : "Couldn't reach your wallet. Try again or paste your address.";
      setError(note);
      setConnecting(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const candidate = value.trim();

    if (isAddress(candidate, { strict: false })) {
      setError(null);
      go(candidate);
      return;
    }

    if (!looksLikeName(candidate.toLowerCase())) {
      setError(
        "Enter a valid wallet address or ENS name to unlock its legend.",
      );
      return;
    }

    setError(null);
    setPending(true);

    try {
      const response = await fetch(
        `/api/resolve?q=${encodeURIComponent(candidate)}`,
      );

      if (response.status === 429) {
        setError(
          "The forge is at capacity. Paste the wallet address or return in a moment.",
        );
        setPending(false);
        return;
      }

      if (!response.ok) {
        setError(
          `The chain knows no wallet named “${candidate}”. Check the spelling.`,
        );
        setPending(false);
        return;
      }

      const data: unknown = await response.json();
      const address =
        typeof data === "object" && data !== null && "address" in data
          ? (data as { address: unknown }).address
          : null;

      if (
        typeof address !== "string" ||
        !isAddress(address, { strict: false })
      ) {
        setError(
          `The chain knows no wallet named “${candidate}”. Check the spelling.`,
        );
        setPending(false);
        return;
      }

      go(address);
    } catch {
      setError(
        "The chain went quiet. Paste the wallet address directly to continue.",
      );
      setPending(false);
    }
  };

  return (
    <form className={styles.addressForm} onSubmit={submit}>
      {label && (
        <label className={styles.addressFormLabel} htmlFor={id}>
          {label}
        </label>
      )}

      <div className={styles.addressFormField}>
        <motion.button
          type="button"
          className={styles.connectButton}
          onClick={connect}
          disabled={connecting || pending}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12 }}
          aria-label="Connect wallet"
          title="Connect wallet"
        >
          <Wallet size={16} strokeWidth={2} aria-hidden />
          <span className={styles.connectButtonLabel}>
            {connecting ? "Connecting…" : "Connect"}
          </span>
        </motion.button>
        <input
          id={id}
          name="address"
          className="mono"
          placeholder="Wallet address or ENS"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error !== null}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <motion.button
          type="submit"
          className={ctaClassName}
          disabled={pending}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12 }}
        >
          {pending ? "Reading the chain…" : cta}
        </motion.button>
      </div>

      {error && (
        <p
          className="mt-2.5 ml-0.5 text-xs leading-relaxed text-(--danger)"
          id={`${id}-error`}
          role="alert"
        >
          {error}
        </p>
      )}

      {examples.length > 0 && (
        <div className={styles.examples}>
          {examples.map((example) => (
            <motion.button
              key={example.address}
              type="button"
              className={styles.chip}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.12 }}
              onClick={() => {
                setValue(example.address);
                setError(null);
              }}
            >
              {example.label}
            </motion.button>
          ))}
        </div>
      )}
    </form>
  );
}
