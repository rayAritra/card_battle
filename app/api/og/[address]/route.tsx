import { ImageResponse } from "next/og";
import { paletteFor } from "@/lib/art/palettes";
import { isValidAddress, normalizeAddress, readStoredCard } from "@/lib/server/card";
import { truncateAddress } from "@/lib/utils/format";
import { STAT_KEYS, type Card } from "@/types";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Share image, 1200x630.
 *
 * READS CACHE ONLY. A crawler hitting a cold URL renders the generic
 * "generate your card" image rather than triggering a chain fetch — one
 * unfurled link must never cost a full profile build.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;

  const stored = isValidAddress(address) ? await readStoredCard(normalizeAddress(address)) : null;

  return stored ? cardImage(stored.card) : genericImage();
}

const SHELL = {
  width: "100%",
  height: "100%",
  display: "flex",
  background: "#08080B",
  color: "#F4F4F5",
  fontFamily: "sans-serif",
} as const;

function genericImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          ...SHELL,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 8, color: "#9B7BFF", display: "flex" }}>
          ONCHAIN BATTLE CARDS
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -1, display: "flex" }}>
          Generate your card
        </div>
        <div style={{ fontSize: 24, color: "#8A8A94", display: "flex" }}>
          Any EVM wallet. Real onchain history. One card.
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}

function cardImage(card: Card): ImageResponse {
  const palette = paletteFor(card.archetype);
  const identity = card.ensName ?? truncateAddress(card.address);
  const netWorth = card.hideNetWorth ? "???" : card.netWorth;

  return new ImageResponse(
    (
      <div style={{ ...SHELL, padding: 64, position: "relative" }}>
        {/* Accent wash, standing in for the generated mesh. */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -140,
            width: 760,
            height: 760,
            borderRadius: 999,
            background: palette.accent,
            opacity: 0.16,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", flex: 1, zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                padding: "6px 12px",
                border: `1px solid ${palette.accent}`,
                borderRadius: 6,
                color: palette.accent,
                fontSize: 18,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              {card.rarity}
            </div>
            <div style={{ display: "flex", fontSize: 20, color: "#8A8A94" }}>{identity}</div>
            <div style={{ display: "flex", fontSize: 20, color: "#5C5C66" }}>{card.serial}</div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 92,
              fontWeight: 800,
              color: palette.accent,
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            {card.archetype}
          </div>

          <div style={{ display: "flex", marginTop: 14, fontSize: 26, color: "#A4A4AE" }}>
            {card.tagline}
          </div>

          <div style={{ display: "flex", gap: 44, marginTop: 40 }}>
            <Vital label="LEVEL" value={String(card.level)} />
            <Vital label="NET WORTH" value={netWorth} />
            <Vital label="ABILITY" value={card.ability.name} />
          </div>

          <div style={{ display: "flex", gap: 18, marginTop: "auto" }}>
            {STAT_KEYS.map((key) => (
              <div
                key={key}
                style={{ display: "flex", flexDirection: "column", gap: 8, width: 190 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16 }}>
                  <span style={{ color: "#8A8A94", letterSpacing: 3, textTransform: "uppercase" }}>
                    {key}
                  </span>
                  <span style={{ color: "#F4F4F5" }}>{card.stats[key].score}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    height: 6,
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.10)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: `${(card.stats[key].score / 99) * 100}%`,
                      borderRadius: 4,
                      background: palette.accent,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 34,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.10)",
              fontSize: 17,
              color: "#5C5C66",
              letterSpacing: 3,
            }}
          >
            <span>ONCHAIN BATTLE CARDS</span>
            <span>BATTLE THIS WALLET</span>
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 15, letterSpacing: 4, color: "#6F6F79" }}>{label}</span>
      <span style={{ fontSize: 40, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
