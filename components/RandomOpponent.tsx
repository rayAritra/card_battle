"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface RandomOpponentProps {
  /** The wallet doing the challenging. Never drawn as its own opponent. */
  address: string;
  /** Used to draw a level-matched opponent rather than any stored card. */
  level?: number;
  label?: string;
}

/**
 * Draws a stored card to fight and goes straight to the match.
 *
 * This is the answer to "who do I fight?" — without it the only way to start a
 * battle is to already know a second address, which almost nobody does.
 */
export function RandomOpponent({ address, level, label = "Find a worthy rival" }: RandomOpponentProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draw = async () => {
    setPending(true);
    setError(null);

    try {
      const query = new URLSearchParams({ exclude: address });
      if (typeof level === "number") query.set("level", String(level));

      const response = await fetch(`/api/random?${query.toString()}`);

      if (response.status === 404) {
        setError("The arena is quiet. Share your card and summon the first challenger.");
        setPending(false);
        return;
      }

      if (!response.ok) throw new Error("draw failed");

      const data: unknown = await response.json();
      const opponent =
        typeof data === "object" && data !== null && "address" in data
          ? (data as { address: unknown }).address
          : null;

      if (typeof opponent !== "string") throw new Error("malformed");

      router.push(`/battle/${address.toLowerCase()}/${opponent.toLowerCase()}`);
    } catch {
      setError("No rival answered the call. Try the arena again.");
      setPending(false);
    }
  };

  return (
    <div className="mt-3.5 grid gap-2">
      <motion.button
        type="button"
        className="button button--ghost w-full"
        onClick={draw}
        disabled={pending}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.12 }}
      >
        {pending ? "Searching the arena…" : label}
      </motion.button>

      {error && (
        <p className="mt-2.5 ml-0.5 text-xs leading-relaxed text-(--danger)" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
