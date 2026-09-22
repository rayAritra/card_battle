"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ShareBarProps {
  /** Absolute or root-relative URL to share. */
  url: string;
  /** Pre-written post text naming the archetype and level. */
  text: string;
  /** The primary call to action that keeps the loop turning. */
  primary?: { href: string; label: string };
  /** When set, offers the rendered card as a downloadable image. */
  download?: { href: string; filename: string };
  /** Override the default top margin — e.g. flush when nested in another gap-managed stack. */
  className?: string;
}

const press = { scale: 0.97 };
const pressTransition = { duration: 0.12 };

/** Copy link, save the card, post to X, and the loop's primary CTA. */
export function ShareBar({ url, text, primary, download, className }: ShareBarProps) {
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
    <div className={cn("mt-5.5 grid gap-2.5", className)}>
      {primary && (
        <motion.a
          className="button button--accent w-full px-5 py-4 text-xs"
          href={primary.href}
          whileTap={press}
          transition={pressTransition}
        >
          {primary.label}
        </motion.a>
      )}

      <div className="flex gap-2">
        <motion.button
          type="button"
          className="button button--ghost flex-1"
          onClick={copy}
          whileTap={press}
          transition={pressTransition}
        >
          {copied ? "Challenge copied" : "Copy challenge"}
        </motion.button>

        {download && (
          <motion.a
            className="button button--ghost flex-1"
            href={download.href}
            download={download.filename}
            whileTap={press}
            transition={pressTransition}
          >
            Save card
          </motion.a>
        )}

        <motion.a
          className="button button--ghost flex-1"
          href={intent}
          target="_blank"
          rel="noreferrer"
          whileTap={press}
          transition={pressTransition}
        >
          Share to X
        </motion.a>
      </div>
    </div>
  );
}
