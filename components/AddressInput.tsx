"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isAddress } from "viem";

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
}

const DEFAULT_EXAMPLES = [
  { label: "vitalik.eth", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
  { label: "Uniswap deployer", address: "0x41653c7d61609D856f29355E404F09f0F9c3901d" },
  { label: "Base builder", address: "0x8c8F1a1e1bFdb15E7ed562efc84e5A588E68aD73" },
];

/**
 * The front door. Validates with viem before navigating, so an invalid address
 * never costs a round trip.
 */
export function AddressInput({
  destinationPrefix = "/card/",
  label = "Wallet address",
  cta = "Generate card",
  examples = DEFAULT_EXAMPLES,
}: AddressInputProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const candidate = value.trim();

    if (!isAddress(candidate, { strict: false })) {
      setError("That is not a valid EVM address. It should start with 0x and be 42 characters.");
      return;
    }

    setError(null);
    setPending(true);
    router.push(`${destinationPrefix}${candidate.toLowerCase()}`);
  };

  return (
    <form className="address-form" onSubmit={submit}>
      <label className="address-form__label" htmlFor="address">
        {label}
      </label>

      <div className="address-form__field">
        <input
          id="address"
          name="address"
          className="mono"
          placeholder="0x…"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error !== null}
          aria-describedby={error ? "address-error" : undefined}
        />
        <motion.button
          type="submit"
          className="button"
          disabled={pending}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12 }}
        >
          {pending ? "Reading…" : cta}
        </motion.button>
      </div>

      {error && (
        <p className="form-error" id="address-error" role="alert">
          {error}
        </p>
      )}

      {examples.length > 0 && (
        <div className="examples">
          {examples.map((example) => (
            <motion.button
              key={example.address}
              type="button"
              className="chip"
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
