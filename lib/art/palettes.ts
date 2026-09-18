export interface Palette {
  bg: string;
  bgAlt: string;
  accent: string;
  accentSoft: string;
  text: string;
  muted: string;
  glow: string;
}

/**
 * One palette per archetype, 16 in all.
 *
 * Accents are chosen to stay distinguishable at thumbnail size — no two
 * archetypes should read as the same card in a feed. The base and text values
 * barely move between palettes; the accent and glow carry the identity.
 */
const BASE = {
  bg: "#08080B",
  bgAlt: "#16161C",
  text: "#F4F4F5",
  muted: "#8A8A94",
} as const;

const palette = (accent: string, accentSoft: string, glow: string): Palette => ({
  ...BASE,
  accent,
  accentSoft,
  glow,
});

export const PALETTES: Record<string, Palette> = {
  "GHOST WALLET": palette("#8FA3B0", "#3A444C", "#8FA3B0"),
  "DEFI WARLORD": palette("#FF3B5C", "#4A1420", "#FF3B5C"),
  "DIAMOND WHALE": palette("#6FD3FF", "#123646", "#6FD3FF"),
  "STABLECOIN MONK": palette("#3FE0A0", "#0F3D2C", "#3FE0A0"),
  "MEV GREMLIN": palette("#B6FF3C", "#2C3F0E", "#B6FF3C"),
  "AIRDROP FARMER": palette("#FFB020", "#4A3208", "#FFB020"),
  "SERIAL APER": palette("#FF6B2C", "#4A1F0A", "#FF6B2C"),
  "LIQUIDITY SAGE": palette("#9B7BFF", "#2A1F52", "#9B7BFF"),
  "BRIDGE NOMAD": palette("#2FE0D6", "#0C3E3B", "#2FE0D6"),
  "NFT WARLOCK": palette("#FF4FD8", "#46103C", "#FF4FD8"),
  "GENESIS RELIC": palette("#E8C56A", "#453714", "#E8C56A"),
  "COLD VAULT": palette("#6C63FF", "#1D1A4A", "#6C63FF"),
  "CHAIN TOURIST": palette("#C9BFA3", "#3A3529", "#C9BFA3"),
  "SPOT MAXIMALIST": palette("#00A3FF", "#0A2E4A", "#00A3FF"),
  "BAGHOLDER SAINT": palette("#FF7A9C", "#4A1A2A", "#FF7A9C"),
  "CYCLE VETERAN": palette("#D96A3C", "#432012", "#D96A3C"),
};

export const DEFAULT_PALETTE = PALETTES["CHAIN TOURIST"];

export const paletteFor = (archetype: string): Palette =>
  PALETTES[archetype] ?? DEFAULT_PALETTE;
