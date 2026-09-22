"use client";

import { useEffect, useRef } from "react";
import "./HoloLayer.css";

interface HoloLayerProps {
  /** The element the tilt is applied to — normally the .battle-card itself. */
  targetRef: React.RefObject<HTMLElement | null>;
  /** Maximum tilt in degrees on each axis. */
  maxTilt?: number;
  enabled?: boolean;
}

const SPRING_STIFFNESS = 150;
const SPRING_DAMPING = 20;
const REST_EPSILON = 0.02;

interface DeviceOrientationEventWithPermission extends EventTarget {
  requestPermission?: () => Promise<"granted" | "denied">;
}

/**
 * Pointer-driven tilt and foil sheen.
 *
 * Writes --rx/--ry (tilt) and --mx/--my (sheen origin) onto the card element
 * from a rAF loop — never from the pointermove handler directly, which would
 * put layout-adjacent work on the input thread. The values are spring-damped
 * toward a target so the card settles rather than snapping, and returns to rest
 * when the pointer leaves.
 *
 * On touch devices it follows device orientation where permitted, and
 * otherwise drifts slowly on its own so the foil is never dead.
 */
export function HoloLayer({ targetRef, maxTilt = 12, enabled = true }: HoloLayerProps) {
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const element = targetRef.current;
    if (!element || !enabled) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    // Target values, written by input handlers; current values, interpolated
    // by the animation frame loop.
    const target = { rx: 0, ry: 0, mx: 50, my: 50, lift: 0 };
    const current = { rx: 0, ry: 0, mx: 50, my: 50, lift: 0 };
    const velocity = { rx: 0, ry: 0, lift: 0 };

    let pointerInside = false;
    let idlePhase = 0;
    let lastFrame = performance.now();

    // Measured once per hover session rather than on every pointermove.
    // `element` is the thing being rotated — once it has any tilt applied,
    // its own `getBoundingClientRect()` returns the axis-aligned box of the
    // already-*projected* (rotated) shape, not the flat rectangle. Feeding
    // that distorted, moving box back into the next frame's angle
    // calculation is a feedback loop: each frame's rect is skewed by the
    // previous frame's rotation, which compounds into the tilt drifting off
    // in a direction the pointer never actually moved — the far edge
    // "coming loose" and sliding out from under its own border as you hover
    // near one side. Snapshotting the rect while the card is still flat (at
    // the moment the pointer arrives) removes the feedback entirely.
    let hoverRect: DOMRect | null = null;

    const setFromPoint = (clientX: number, clientY: number) => {
      const rect = hoverRect ?? element.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;

      target.ry = (px - 0.5) * 2 * maxTilt;
      target.rx = -(py - 0.5) * 2 * maxTilt;
      target.mx = px * 100;
      target.my = py * 100;
    };

    const onPointerEnter = () => {
      hoverRect = element.getBoundingClientRect();
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerInside = true;
      target.lift = 1;
      if (!hoverRect) hoverRect = element.getBoundingClientRect();
      setFromPoint(event.clientX, event.clientY);
    };

    const onPointerLeave = () => {
      pointerInside = false;
      hoverRect = null;
      target.rx = 0;
      target.ry = 0;
      target.mx = 50;
      target.my = 50;
      target.lift = 0;
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (pointerInside) return;
      const beta = event.beta ?? 0; // front-back, -180..180
      const gamma = event.gamma ?? 0; // left-right, -90..90

      target.rx = Math.max(-maxTilt, Math.min(maxTilt, (beta - 45) / 4));
      target.ry = Math.max(-maxTilt, Math.min(maxTilt, gamma / 4));
      target.mx = 50 + (target.ry / maxTilt) * 40;
      target.my = 50 + (target.rx / maxTilt) * 40;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      // Idle drift keeps the foil alive when nothing is touching the card.
      if (!pointerInside && target.rx === 0 && target.ry === 0) {
        idlePhase += dt * 0.35;
        target.mx = 50 + Math.sin(idlePhase) * 22;
        target.my = 50 + Math.cos(idlePhase * 0.8) * 16;
      }

      for (const axis of ["rx", "ry", "lift"] as const) {
        const displacement = target[axis] - current[axis];
        const acceleration = SPRING_STIFFNESS * displacement - SPRING_DAMPING * velocity[axis];
        velocity[axis] += acceleration * dt;
        current[axis] += velocity[axis] * dt;

        if (
          Math.abs(displacement) < REST_EPSILON &&
          Math.abs(velocity[axis]) < REST_EPSILON
        ) {
          current[axis] = target[axis];
          velocity[axis] = 0;
        }
      }

      current.mx += (target.mx - current.mx) * Math.min(1, dt * 8);
      current.my += (target.my - current.my) * Math.min(1, dt * 8);

      element.style.setProperty("--rx", `${current.rx.toFixed(2)}deg`);
      element.style.setProperty("--ry", `${current.ry.toFixed(2)}deg`);
      element.style.setProperty("--mx", `${current.mx.toFixed(1)}%`);
      element.style.setProperty("--my", `${current.my.toFixed(1)}%`);
      element.style.setProperty("--lift", current.lift.toFixed(3));

      frameRef.current = requestAnimationFrame(tick);
    };

    element.addEventListener("pointerenter", onPointerEnter);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerleave", onPointerLeave);
    element.addEventListener("pointercancel", onPointerLeave);
    frameRef.current = requestAnimationFrame(tick);

    // Device orientation needs explicit permission on iOS; where it is not
    // granted we simply keep the idle drift.
    const orientationApi = window.DeviceOrientationEvent as unknown as
      | DeviceOrientationEventWithPermission
      | undefined;
    let orientationBound = false;

    if (orientationApi && typeof orientationApi.requestPermission !== "function") {
      window.addEventListener("deviceorientation", onOrientation);
      orientationBound = true;
    }

    return () => {
      cancelAnimationFrame(frameRef.current);
      element.removeEventListener("pointerenter", onPointerEnter);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerleave", onPointerLeave);
      element.removeEventListener("pointercancel", onPointerLeave);
      if (orientationBound) window.removeEventListener("deviceorientation", onOrientation);
      element.style.removeProperty("--rx");
      element.style.removeProperty("--ry");
      element.style.removeProperty("--lift");
    };
  }, [targetRef, maxTilt, enabled]);

  return (
    <>
      <div className="holo" aria-hidden />
      <div className="holo-sparkle" aria-hidden />
    </>
  );
}
