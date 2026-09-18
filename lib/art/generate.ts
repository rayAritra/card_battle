import type { Rarity } from "@/types";
import { createRng, seedFromAddress, type Rng } from "./noise";
import type { Palette } from "./palettes";

/**
 * Deterministic card artwork as a standalone SVG string.
 *
 * No AI image generation, no external images, no storage: the same address
 * always yields byte-identical markup, so the art can be regenerated anywhere
 * (server render, OG image, client) without a round trip.
 *
 * Three layers, drawn back to front:
 *   1. a gradient mesh from three seeded control points
 *   2. a constellation field, seeded count, connected by faint lines
 *   3. a frame ornament whose complexity scales with rarity
 */

const WIDTH = 380;
const HEIGHT = 240;

/** Ornament complexity per rarity tier. */
const ORNAMENT_TICKS: Record<Rarity, number> = {
  common: 0,
  rare: 4,
  epic: 8,
  legendary: 14,
  mythic: 22,
};

const round = (value: number): number => Math.round(value * 10) / 10;

interface Point {
  x: number;
  y: number;
  r: number;
}

function meshLayer(rng: Rng, palette: Palette): string {
  const blobs: Point[] = Array.from({ length: 3 }, () => ({
    x: round(rng.range(0.1, 0.9) * WIDTH),
    y: round(rng.range(0.1, 0.9) * HEIGHT),
    r: round(rng.range(0.45, 0.95) * WIDTH),
  }));

  const colors = [palette.accent, palette.accentSoft, palette.accent];

  const gradients = blobs
    .map(
      (blob, index) => `
    <radialGradient id="mesh${index}" cx="${round(blob.x / WIDTH)}" cy="${round(blob.y / HEIGHT)}" r="0.9">
      <stop offset="0%" stop-color="${colors[index]}" stop-opacity="${index === 0 ? 0.55 : 0.38}"/>
      <stop offset="100%" stop-color="${colors[index]}" stop-opacity="0"/>
    </radialGradient>`,
    )
    .join("");

  const shapes = blobs
    .map(
      (blob, index) =>
        `<ellipse cx="${blob.x}" cy="${blob.y}" rx="${blob.r}" ry="${round(blob.r * 0.72)}" fill="url(#mesh${index})"/>`,
    )
    .join("");

  return `${gradients}||${shapes}`;
}

function constellationLayer(rng: Rng, palette: Palette): string {
  const count = rng.int(18, 46);

  const stars: Point[] = Array.from({ length: count }, () => ({
    x: round(rng.range(6, WIDTH - 6)),
    y: round(rng.range(6, HEIGHT - 6)),
    r: round(rng.range(0.6, 2.1)),
  }));

  // Connect each star to its nearest neighbour only — enough structure to read
  // as a constellation, sparse enough to stay quiet behind the type.
  const links: string[] = [];
  for (let i = 0; i < stars.length; i++) {
    let nearest = -1;
    let nearestDistance = Infinity;

    for (let j = 0; j < stars.length; j++) {
      if (i === j) continue;
      const distance = (stars[i].x - stars[j].x) ** 2 + (stars[i].y - stars[j].y) ** 2;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = j;
      }
    }

    if (nearest >= 0 && nearestDistance < 90 ** 2) {
      links.push(
        `<line x1="${stars[i].x}" y1="${stars[i].y}" x2="${stars[nearest].x}" y2="${stars[nearest].y}" stroke="${palette.accent}" stroke-opacity="0.16" stroke-width="0.6"/>`,
      );
    }
  }

  const dots = stars
    .map(
      (star) =>
        `<circle cx="${star.x}" cy="${star.y}" r="${star.r}" fill="${palette.text}" fill-opacity="${round(0.18 + star.r * 0.16)}"/>`,
    )
    .join("");

  return `${links.join("")}${dots}`;
}

function ornamentLayer(rng: Rng, palette: Palette, rarity: Rarity): string {
  const ticks = ORNAMENT_TICKS[rarity];
  if (ticks === 0) return "";

  const marks: string[] = [];
  for (let i = 0; i < ticks; i++) {
    const along = (i + 0.5) / ticks;
    const length = round(rng.range(4, 12));
    const onTop = i % 2 === 0;
    const x = round(along * WIDTH);
    const y = onTop ? 0 : HEIGHT;
    const y2 = onTop ? length : HEIGHT - length;

    marks.push(
      `<line x1="${x}" y1="${y}" x2="${x}" y2="${y2}" stroke="${palette.accent}" stroke-opacity="0.5" stroke-width="1"/>`,
    );
  }

  // Legendary and mythic also get corner brackets.
  if (ticks >= 14) {
    const size = 18;
    const corners = [
      `M 2 ${size} L 2 2 L ${size} 2`,
      `M ${WIDTH - size} 2 L ${WIDTH - 2} 2 L ${WIDTH - 2} ${size}`,
      `M 2 ${HEIGHT - size} L 2 ${HEIGHT - 2} L ${size} ${HEIGHT - 2}`,
      `M ${WIDTH - size} ${HEIGHT - 2} L ${WIDTH - 2} ${HEIGHT - 2} L ${WIDTH - 2} ${HEIGHT - size}`,
    ];
    for (const path of corners) {
      marks.push(
        `<path d="${path}" fill="none" stroke="${palette.accent}" stroke-opacity="0.7" stroke-width="1.2"/>`,
      );
    }
  }

  return marks.join("");
}

/**
 * The card's art panel as an SVG string.
 * Identical input always produces an identical string.
 */
export function generateCardArt(
  address: string,
  palette: Palette,
  rarity: Rarity = "common",
): string {
  const rng = createRng(seedFromAddress(address));

  const [gradients, meshShapes] = meshLayer(rng, palette).split("||");
  const constellation = constellationLayer(rng, palette);
  const ornament = ornamentLayer(rng, palette, rarity);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Generated card artwork">`,
    `<defs>${gradients}`,
    `<linearGradient id="base" x1="0" y1="0" x2="0" y2="1">`,
    `<stop offset="0%" stop-color="${palette.bgAlt}"/>`,
    `<stop offset="100%" stop-color="${palette.bg}"/>`,
    `</linearGradient>`,
    `</defs>`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#base)"/>`,
    meshShapes,
    constellation,
    ornament,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#base)" opacity="0.28"/>`,
    `</svg>`,
  ].join("");
}

/**
 * The same artwork as a data URI, for `background-image` and OG images.
 * URI-encoded rather than base64 so it works unchanged in the browser,
 * where `Buffer` does not exist.
 */
export function cardArtDataUri(
  address: string,
  palette: Palette,
  rarity: Rarity = "common",
): string {
  const svg = generateCardArt(address, palette, rarity);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
