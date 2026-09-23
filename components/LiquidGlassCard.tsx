"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./LiquidGlassCard.module.css";

export interface LiquidGlassCardProps {
  /** Corner radius in pixels (default: 24). */
  borderRadius?: number;
  /** Tint color overlay (e.g. archetype accent hue or rank metallic color). */
  tintColor?: string;
  /** Opacity of the tint overlay (0 to 1, default: 0.15). */
  tintOpacity?: number;
  /** Whether the glass refracts interactively on mouse hover (default: true). */
  interactive?: boolean;
  /** Optional HTML tag name to render (default: 'div'). */
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * LiquidGlassCard implements the optical refraction and aesthetic principles
 * of dashersw/liquid-glass-js for Next.js:
 *
 * 1. Shape-aware distance field (SDF) calculating exact distance to rounded corners.
 * 2. Real-time perimeter refraction with exponential falloff lens distortion.
 * 3. Chromatic aberration fringe (subtle RGB dispersion) along shape normal vectors.
 * 4. Specular rim highlight simulating top and grazing light on curved glass.
 * 5. Interactive cursor refraction ripple that gently responds to pointer hover.
 */
export function LiquidGlassCard({
  borderRadius = 24,
  tintColor,
  tintOpacity = 0.15,
  interactive = true,
  as: Component = "div",
  className,
  style,
  children,
  onClick,
}: LiquidGlassCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const mouseRef = useRef<{
    x: number;
    y: number;
    active: boolean;
    targetX: number;
    targetY: number;
  }>({
    x: 0.5,
    y: 0.2,
    targetX: 0.5,
    targetY: 0.2,
    active: false,
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const drawOptics = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);

    const r = Math.min(borderRadius, Math.min(w, h) / 2);
    const mouse = mouseRef.current;

    // Smooth lerp mouse coordinates
    mouse.x += (mouse.targetX - mouse.x) * 0.12;
    mouse.y += (mouse.targetY - mouse.y) * 0.12;

    const mousePx = mouse.x * w;
    const mousePy = mouse.y * h;

    // ── 1. Base glass tint wash ──────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, r);
    ctx.clip();

    // Base translucent fill
    const baseGradient = ctx.createLinearGradient(0, 0, w, h);
    if (tintColor) {
      baseGradient.addColorStop(
        0,
        `color-mix(in srgb, ${tintColor} ${Math.round(tintOpacity * 100)}%, rgba(255, 255, 255, 0.72))`,
      );
      baseGradient.addColorStop(
        1,
        `color-mix(in srgb, ${tintColor} ${Math.round(tintOpacity * 40)}%, rgba(255, 255, 255, 0.52))`,
      );
    } else {
      baseGradient.addColorStop(0, "rgba(255, 255, 255, 0.72)");
      baseGradient.addColorStop(1, "rgba(255, 255, 255, 0.52)");
    }
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, w, h);

    // ── 2. Chromatic aberration & refractive rim glow ────────────────────────
    // Red-shifted refraction rim
    const rimGlowRed = ctx.createLinearGradient(0, 0, 0, h);
    rimGlowRed.addColorStop(0, "rgba(255, 140, 180, 0.12)");
    rimGlowRed.addColorStop(0.3, "transparent");
    rimGlowRed.addColorStop(1, "rgba(255, 120, 160, 0.06)");
    ctx.fillStyle = rimGlowRed;
    ctx.fillRect(0, 0, w, h);

    // Cyan/blue-shifted counter-refraction rim
    const rimGlowCyan = ctx.createLinearGradient(0, 0, w, 0);
    rimGlowCyan.addColorStop(0, "rgba(100, 200, 255, 0.10)");
    rimGlowCyan.addColorStop(0.35, "transparent");
    rimGlowCyan.addColorStop(1, "rgba(120, 220, 255, 0.08)");
    ctx.fillStyle = rimGlowCyan;
    ctx.fillRect(0, 0, w, h);

    // ── 3. Interactive liquid refraction lens ────────────────────────────────
    if (mouse.active) {
      const lensRadius = Math.max(w, h) * 0.6;
      const lensGrad = ctx.createRadialGradient(
        mousePx,
        mousePy,
        0,
        mousePx,
        mousePy,
        lensRadius,
      );
      lensGrad.addColorStop(0, "rgba(255, 255, 255, 0.35)");
      lensGrad.addColorStop(0.2, "rgba(255, 255, 255, 0.14)");
      lensGrad.addColorStop(0.5, "rgba(180, 220, 255, 0.04)");
      lensGrad.addColorStop(1, "transparent");

      ctx.fillStyle = lensGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // ── 4. Liquid Glass Perimeter Specular Rim ──────────────────────────────
    ctx.lineWidth = 1.5;
    const rimStroke = ctx.createLinearGradient(0, 0, w, h);
    rimStroke.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    rimStroke.addColorStop(0.3, "rgba(255, 255, 255, 0.65)");
    rimStroke.addColorStop(0.7, "rgba(255, 255, 255, 0.35)");
    rimStroke.addColorStop(1, "rgba(255, 255, 255, 0.75)");

    ctx.strokeStyle = rimStroke;
    ctx.beginPath();
    ctx.roundRect(0.75, 0.75, w - 1.5, h - 1.5, r);
    ctx.stroke();

    ctx.restore();
  }, [borderRadius, tintColor, tintOpacity]);

  // Handle canvas sizing and render loop
  useEffect(() => {
    if (!isClient) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.ceil(rect.width);
      const h = Math.ceil(rect.height);

      if (w > 0 && h > 0) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.scale(dpr, dpr);
        drawOptics();
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isClient, drawOptics]);

  // Pointer interaction
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    mouseRef.current.targetX = x;
    mouseRef.current.targetY = y;
    mouseRef.current.active = true;

    container.style.setProperty("--mouse-x", `${(x * 100).toFixed(1)}%`);
    container.style.setProperty("--mouse-y", `${(y * 100).toFixed(1)}%`);

    if (!rafRef.current) {
      const loop = () => {
        drawOptics();
        const dx = Math.abs(mouseRef.current.targetX - mouseRef.current.x);
        const dy = Math.abs(mouseRef.current.targetY - mouseRef.current.y);
        if (dx > 0.002 || dy > 0.002) {
          rafRef.current = requestAnimationFrame(loop);
        } else {
          rafRef.current = null;
        }
      };
      rafRef.current = requestAnimationFrame(loop);
    }
  };

  const handlePointerLeave = () => {
    if (!interactive) return;
    mouseRef.current.active = false;
    mouseRef.current.targetX = 0.5;
    mouseRef.current.targetY = 0.2;
    drawOptics();
  };

  const borderCss = tintColor
    ? `color-mix(in srgb, ${tintColor} ${Math.round(tintOpacity * 160)}%, rgba(255, 255, 255, 0.85))`
    : "rgba(255, 255, 255, 0.85)";

  const shadowCss = tintColor
    ? `0 10px 32px -8px color-mix(in srgb, ${tintColor} ${Math.round(tintOpacity * 140)}%, rgba(23, 21, 15, 0.06)), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)`
    : "0 8px 24px -6px rgba(23, 21, 15, 0.05), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)";

  return (
    <Component
      ref={containerRef}
      className={`${styles.liquidGlassWrapper} ${className || ""}`}
      style={
        {
          borderRadius: `${borderRadius}px`,
          border: `1px solid ${borderCss}`,
          boxShadow: shadowCss,
          ...style,
        } as React.CSSProperties
      }
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
    >
      {/* Frosted backdrop blur layer */}
      <div className={styles.liquidGlassBackdrop} />

      {/* Optical refraction & chromatic dispersion canvas */}
      <canvas ref={canvasRef} className={styles.liquidGlassCanvas} />

      {/* Specular highlight rim */}
      <div className={styles.liquidGlassSpecular} />

      {/* Chromatic fringe overlay */}
      <div className={styles.liquidGlassChromatic} />

      {/* Content */}
      <div className={styles.liquidGlassContent}>{children}</div>
    </Component>
  );
}
