"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isAddress } from "viem";
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
  examples = DEFAULT_EXAMPLES,
  id = "address",
}: AddressInputProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const go = (address: string) => {
    setPending(true);
    router.push(`${destinationPrefix}${address.toLowerCase()}`);
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
          className="button button--accent"
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
