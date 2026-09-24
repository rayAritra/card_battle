"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "@/app/archetypes/archetypes.module.css";

interface ArchetypeScrollerProps {
  children: ReactNode;
}

/**
 * On a laptop-sized viewport, borrows the mouse wheel while the archetype
 * row is fully framed in the viewport: that scroll drives the row
 * horizontally instead of the page vertically. It only borrows scroll once
 * the row is already comfortably in view — never forces extra vertical
 * scroll just to get there — and hands the wheel straight back to the page
 * once the row bottoms out in either direction. Smaller viewports (and
 * reduced-motion) get the plain swipeable single row instead — scroll-
 * jacking a touch surface fights the user's own gesture, so it's
 * desktop-only.
 */
export function ArchetypeScroller({ children }: ArchetypeScrollerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const update = () => {
      setPinned(desktopQuery.matches && !reducedMotionQuery.matches);
    };
    update();
    desktopQuery.addEventListener("change", update);
    reducedMotionQuery.addEventListener("change", update);
    return () => {
      desktopQuery.removeEventListener("change", update);
      reducedMotionQuery.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const row = rowRef.current;
    if (!pinned || !wrapper || !row) return;

    let horizontalDistance = 0;
    // 0 = first card at rest, 1 = last card at rest.
    let progress = 0;

    function measure() {
      if (!row) return;
      horizontalDistance = Math.max(0, row.scrollWidth - row.clientWidth);
    }

    function applyProgress() {
      if (!row) return;
      row.style.transform = `translate3d(${-progress * horizontalDistance}px, 0, 0)`;
    }

    function isFramed() {
      if (!wrapper) return false;
      const header = document.querySelector("header");
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const rect = wrapper.getBoundingClientRect();
      return (
        rect.top >= headerHeight - 1 && rect.bottom <= window.innerHeight + 1
      );
    }

    function onWheel(e: WheelEvent) {
      if (horizontalDistance <= 0 || e.deltaY === 0 || !wrapper) return;

      const atStart = progress <= 0;
      const atEnd = progress >= 1;
      const scrollingDown = e.deltaY > 0;

      // A keyboard/scrollbar jump can carry the page away from the row
      // while progress sits mid-way (no wheel event to intercept along the
      // way) — once the row isn't even partly on screen any more, let go
      // rather than freezing the next wheel tick on an invisible row.
      const rect = wrapper.getBoundingClientRect();
      const onScreen = rect.bottom > 0 && rect.top < window.innerHeight;

      const midway = onScreen && !atStart && !atEnd;
      const enteringFromStart = atStart && scrollingDown && isFramed();
      const enteringFromEnd = atEnd && !scrollingDown && isFramed();

      if (!midway && !enteringFromStart && !enteringFromEnd) return;

      e.preventDefault();
      progress = Math.min(
        1,
        Math.max(0, progress + e.deltaY / horizontalDistance),
      );
      applyProgress();
    }

    measure();
    applyProgress();

    const resizeObserver = new ResizeObserver(() => {
      const prevDistance = horizontalDistance;
      measure();
      if (prevDistance !== horizontalDistance) applyProgress();
    });
    resizeObserver.observe(row);

    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("wheel", onWheel);
      row.style.transform = "";
    };
  }, [pinned]);

  return (
    <div
      ref={wrapperRef}
      className={pinned ? styles.archetypePinBreakout : undefined}
    >
      <div
        ref={rowRef}
        className={`${styles.archetypeGrid} ${
          pinned ? styles.archetypeGridPinned : styles.archetypeGridFlow
        }`}
      >
        {children}
      </div>
    </div>
  );
}
