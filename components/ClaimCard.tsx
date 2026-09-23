"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { clearSelf, readSelf, writeSelf } from "@/lib/utils/recents";
import { cn } from "@/lib/utils";

interface ClaimCardProps {
  address: string;
}

/**
 * "This is my wallet" — stored in the browser, never on the server.
 *
 * Claiming turns every Fight button in the app into one tap instead of a form.
 * It is not a login and proves nothing: anything that actually needs proof of
 * ownership goes through /settings, which verifies a signature. Keeping the
 * two separate is why this can be a single click with no wallet connection.
 */
export function ClaimCard({ address }: ClaimCardProps) {
  const wallet = address.toLowerCase();
  const [self, setSelf] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSelf(readSelf());
    setReady(true);
  }, []);

  if (!ready) return null;

  const claimed = self === wallet;

  return (
    <motion.button
      type="button"
      className={cn(
        "mono mb-4.5 cursor-pointer self-start rounded-full border-[1.5px] border-(--line) bg-transparent px-3 py-1.5 text-[11px] text-[var(--muted)] transition-colors duration-150 hover:border-brand hover:text-foreground",
        claimed && "border-brand bg-(--accent-soft) text-foreground",
      )}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      aria-pressed={claimed}
      onClick={() => {
        if (claimed) {
          clearSelf();
          setSelf(null);
        } else {
          writeSelf(wallet);
          setSelf(wallet);
        }
      }}
    >
      {claimed ? "Your player card" : "Set as my player card"}
    </motion.button>
  );
}
