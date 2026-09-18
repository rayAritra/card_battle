import { describe, expect, it } from "vitest";
import { generateCardArt, cardArtDataUri } from "./generate";
import { PALETTES, paletteFor } from "./palettes";
import { ARCHETYPE_NAMES } from "@/lib/stats/archetypes";

const A = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
const B = "0x1111111111111111111111111111111111111111";

describe("generated card art", () => {
  it("is identical for the same address every time", () => {
    const first = generateCardArt(A, paletteFor("DEFI WARLORD"), "epic");
    const second = generateCardArt(A, paletteFor("DEFI WARLORD"), "epic");
    expect(first).toBe(second);
  });

  it("is case-insensitive in the address", () => {
    expect(generateCardArt(A.toUpperCase(), paletteFor("DEFI WARLORD"), "epic")).toBe(
      generateCardArt(A, paletteFor("DEFI WARLORD"), "epic"),
    );
  });

  it("differs between addresses", () => {
    expect(generateCardArt(A, paletteFor("DEFI WARLORD"), "epic")).not.toBe(
      generateCardArt(B, paletteFor("DEFI WARLORD"), "epic"),
    );
  });

  it("escalates ornament complexity with rarity", () => {
    const common = generateCardArt(A, paletteFor("DEFI WARLORD"), "common");
    const mythic = generateCardArt(A, paletteFor("DEFI WARLORD"), "mythic");
    expect(mythic.length).toBeGreaterThan(common.length);
  });

  it("emits well-formed, self-contained SVG", () => {
    const svg = generateCardArt(A, paletteFor("MEV GREMLIN"), "legendary");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    // The xmlns URI is a namespace, not a fetch. What must not appear is any
    // reference that would make the card depend on a remote resource.
    expect(svg).not.toContain("<image");
    expect(svg).not.toMatch(/(href|src)\s*=/);
    expect(svg).not.toContain("url(http");
    expect(svg).not.toContain("NaN");
    expect(svg).not.toContain("undefined");
  });

  it("produces a browser-safe data URI with no Buffer dependency", () => {
    const uri = cardArtDataUri(A, paletteFor("NFT WARLOCK"), "rare");
    expect(uri.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(uri).not.toContain("#");
  });
});

describe("palettes", () => {
  it("covers every archetype", () => {
    for (const name of ARCHETYPE_NAMES) expect(PALETTES[name], name).toBeDefined();
  });

  it("gives every archetype a distinct accent", () => {
    const accents = Object.values(PALETTES).map((palette) => palette.accent);
    expect(new Set(accents).size).toBe(accents.length);
  });
});
