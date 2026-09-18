"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface ShareBarProps {
  /** Absolute or root-relative URL to share. */
  url: string;
  /** Pre-written post text naming the archetype and level. */
  text: string;
  /** The primary call to action that keeps the loop turning. */
  primary?: { href: string; label: string };
}

const press = { scale: 0.97 };
const pressTransition = { duration: 0.12 };

/** Copy link, post to X, and the loop's primary CTA. */
export function ShareBar({ url, text, primary }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const absolute =
    url.startsWith("http") || typeof window === "undefined"
      ? url
      : `${window.location.origin}${url}`;

  const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(absolute)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="share-bar">
      {primary && (
        <motion.a
          className="button button--accent share-bar__primary"
          href={primary.href}
          whileTap={press}
          transition={pressTransition}
        >
          {primary.label}
        </motion.a>
      )}

      <div className="share-bar__secondary">
        <motion.button
          type="button"
          className="button button--ghost"
          onClick={copy}
          whileTap={press}
          transition={pressTransition}
        >
          {copied ? "Link copied" : "Copy link"}
        </motion.button>

        <motion.a
          className="button button--ghost"
          href={intent}
          target="_blank"
          rel="noreferrer"
          whileTap={press}
          transition={pressTransition}
        >
          Post to X
        </motion.a>
      </div>
    </div>
  );
}
