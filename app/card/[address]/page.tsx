import type { Metadata } from "next";
import { headers } from "next/headers";
import { AddressInput } from "@/components/AddressInput";
import { RevealSequence } from "@/components/RevealSequence";
import { ShareBar } from "@/components/ShareBar";
import { RateLimited } from "@/components/RateLimited";
import { InvalidAddress } from "@/components/InvalidAddress";
import { getOrComputeCard, isValidAddress, normalizeAddress, readStoredCard } from "@/lib/server/card";
import { checkRateLimit } from "@/lib/server/rate";
import { truncateAddress } from "@/lib/utils/format";
import { farcasterFrameMeta } from "@/lib/server/frame";

export const dynamic = "force-dynamic";

const LIMIT_PER_HOUR = 20;

interface PageProps {
  params: Promise<{ address: string }>;
}

/**
 * Metadata is built from the CACHE ONLY — the same rule as /api/og. A crawler
 * must never be able to trigger a chain fetch.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { address } = await params;
  if (!isValidAddress(address)) return { title: "Unknown wallet" };

  const wallet = normalizeAddress(address);
  const stored = await readStoredCard(wallet);
  const name = stored?.card.ensName ?? truncateAddress(wallet);

  const title = stored ? `${name} · ${stored.card.archetype} · Level ${stored.card.level}` : name;
  const description = stored
    ? `${stored.card.archetype}, level ${stored.card.level}. ${stored.card.tagline}. Battle this wallet.`
    : "Generate a battle card from any EVM wallet.";

  const image = `/api/og/${wallet}`;

  return {
    title,
    description,
    robots: stored?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    other: farcasterFrameMeta({
      image,
      buttonLabel: "Battle this wallet",
      target: `/card/${wallet}`,
      cardAddress: wallet,
    }),
  };
}

export default async function CardPage({ params }: PageProps) {
  const { address } = await params;

  if (!isValidAddress(address)) return <InvalidAddress value={address} />;

  const wallet = normalizeAddress(address);

  const headerList = await headers();
  const verdict = await checkRateLimit(
    "card",
    LIMIT_PER_HOUR,
    new Request("https://local/card", { headers: headerList }),
  );
  if (!verdict.allowed) return <RateLimited perHour={LIMIT_PER_HOUR} retryAt={verdict.reset} />;

  const { card } = await getOrComputeCard(wallet);
  const name = card.ensName ?? truncateAddress(card.address);

  const shareText = `${name} is a ${card.archetype} — level ${card.level}. Battle this wallet.`;

  return (
    <main className="page card-page">
      <RevealSequence card={card} />

      <aside className="card-aside">
        <p className="eyebrow">Challenge</p>
        <h1 className="card-aside__title display">Battle this wallet</h1>
        <p className="card-aside__copy">
          Enter your address. The match is seeded from both addresses and today&rsquo;s date, so the
          result is the same for everyone who opens the link — and the order of the two wallets
          never changes the outcome.
        </p>

        <AddressInput
          destinationPrefix={`/battle/${wallet}/`}
          label="Your address"
          cta="Fight"
          examples={[]}
        />

        <ShareBar url={`/card/${wallet}`} text={shareText} />

        <dl className="card-aside__facts">
          <div>
            <dt>Archetype</dt>
            <dd>{card.archetype}</dd>
          </div>
          <div>
            <dt>Rarity</dt>
            <dd>{card.rarity}</dd>
          </div>
          <div>
            <dt>Serial</dt>
            <dd className="mono">{card.serial}</dd>
          </div>
        </dl>
      </aside>
    </main>
  );
}
