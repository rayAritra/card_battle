import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { BattleReplay } from "@/components/BattleReplay";
import { InvalidAddress } from "@/components/InvalidAddress";
import { RateLimited } from "@/components/RateLimited";
import { ShareBar } from "@/components/ShareBar";
import { battle } from "@/lib/battle/engine";
import { generateBattleCommentary } from "@/lib/flavor/generate";
import { getOrComputeCard, isValidAddress, normalizeAddress, readStoredCard } from "@/lib/server/card";
import { checkRateLimit } from "@/lib/server/rate";
import { farcasterFrameMeta } from "@/lib/server/frame";
import { persistBattle } from "@/lib/server/battle";
import { truncateAddress, utcDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const LIMIT_PER_HOUR = 60;

interface PageProps {
  params: Promise<{ a: string; b: string }>;
  searchParams: Promise<{ n?: string }>;
}

const parseNonce = (raw: string | undefined): number => {
  const parsed = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, 9_999) : 0;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { a, b } = await params;
  if (!isValidAddress(a) || !isValidAddress(b)) return { title: "Battle" };

  const [cardA, cardB] = await Promise.all([
    readStoredCard(normalizeAddress(a)),
    readStoredCard(normalizeAddress(b)),
  ]);

  const nameA = cardA?.card.archetype ?? truncateAddress(a);
  const nameB = cardB?.card.archetype ?? truncateAddress(b);
  const title = `${nameA} vs ${nameB}`;
  const description = "A deterministic match between two onchain wallets. Get your own card.";
  const image = `/api/og/${normalizeAddress(a)}`;

  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    other: farcasterFrameMeta({
      image,
      buttonLabel: "Get your own card",
      target: `/battle/${normalizeAddress(a)}/${normalizeAddress(b)}`,
    }),
  };
}

export default async function BattlePage({ params, searchParams }: PageProps) {
  const { a, b } = await params;
  const { n } = await searchParams;

  if (!isValidAddress(a)) return <InvalidAddress value={a} />;
  if (!isValidAddress(b)) return <InvalidAddress value={b} />;

  const addrA = normalizeAddress(a);
  const addrB = normalizeAddress(b);

  if (addrA === addrB) {
    return (
      <main className="page state-page">
        <p className="eyebrow">Impossible</p>
        <h1 className="state-page__title display">A wallet cannot fight itself</h1>
        <p className="state-page__copy">Pick a different challenger.</p>
        <Link className="button" href={`/card/${addrA}`}>
          Back to the card
        </Link>
      </main>
    );
  }

  const headerList = await headers();
  const verdict = await checkRateLimit(
    "battle",
    LIMIT_PER_HOUR,
    new Request("https://local/battle", { headers: headerList }),
  );
  if (!verdict.allowed) return <RateLimited perHour={LIMIT_PER_HOUR} retryAt={verdict.reset} />;

  const nonce = parseNonce(n);
  const [storedA, storedB] = await Promise.all([
    getOrComputeCard(addrA),
    getOrComputeCard(addrB),
  ]);

  const result = battle(storedA.card, storedB.card, utcDate(), nonce);
  await persistBattle(result, addrA, addrB);

  const winner = result.winner === addrA ? storedA.card : storedB.card;
  const loser = result.winner === addrA ? storedB.card : storedA.card;

  const commentary = await generateBattleCommentary(
    winner.archetype,
    loser.archetype,
    result.margin,
  );

  const shareText = `${winner.archetype} (lvl ${winner.level}) beat ${loser.archetype} (lvl ${loser.level}) ${
    (result.rounds.length + result.margin) / 2
  }-${(result.rounds.length - result.margin) / 2}.`;

  return (
    <main className="page">
      <BattleReplay
        cardA={storedA.card}
        cardB={storedB.card}
        result={result}
        commentary={commentary}
      >
        <div className="replay__actions">
          <Link className="button button--ghost" href={`/battle/${addrA}/${addrB}?n=${nonce + 1}`}>
            Rematch
          </Link>
          <ShareBar
            url={`/battle/${addrA}/${addrB}${nonce ? `?n=${nonce}` : ""}`}
            text={shareText}
            primary={{ href: "/", label: "Get your own card" }}
          />
        </div>
      </BattleReplay>
    </main>
  );
}
