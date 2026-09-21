import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AddressInput } from "@/components/AddressInput";
import { ClaimCard } from "@/components/ClaimCard";
import { RandomOpponent } from "@/components/RandomOpponent";
import { RecordVisit } from "@/components/RecordVisit";
import { RevealSequence } from "@/components/RevealSequence";
import { ShareBar } from "@/components/ShareBar";
import { RateLimited } from "@/components/RateLimited";
import { InvalidAddress } from "@/components/InvalidAddress";
import { getOrComputeCard, isValidAddress, normalizeAddress, readStoredCard } from "@/lib/server/card";
import { checkRateLimit } from "@/lib/server/rate";
import { resolveIdentity } from "@/lib/server/resolve";
import { walletHistory } from "@/lib/server/history";
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

  // The URL may carry a name rather than an address; the page redirects to the
  // canonical form, but a crawler may unfurl the name directly.
  const identity = isValidAddress(address)
    ? { address: normalizeAddress(address) }
    : await resolveIdentity(address);

  if (!identity) return { title: "Unknown identity" };

  const wallet = identity.address;
  const stored = await readStoredCard(wallet);
  const name = stored?.card.ensName ?? truncateAddress(wallet);

  const title = stored ? `${name} · ${stored.card.archetype} · LVL ${stored.card.level}` : name;
  const description = stored
    ? `${stored.card.archetype}, LVL ${stored.card.level}. ${stored.card.tagline}. Enter the arena.`
    : "Forge a battle card from any EVM wallet and enter the arena.";

  const image = `/api/og/${wallet}`;

  return {
    title,
    description,
    // A card is reachable as /card/vitalik.eth as well as by address. The page
    // redirects, but `loading.tsx` opens a Suspense boundary, so the response
    // has already begun streaming and the redirect resolves on the client
    // rather than as a 307. This keeps one canonical URL for crawlers.
    alternates: { canonical: `/card/${wallet}` },
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
      buttonLabel: "Challenge this wallet",
      target: `/card/${wallet}`,
      cardAddress: wallet,
    }),
  };
}

export default async function CardPage({ params }: PageProps) {
  const { address } = await params;

  // /card/vitalik.eth works, and lands on /card/0xd8dA… so the shared link,
  // the OG image and the battle URL all key off one canonical address.
  if (!isValidAddress(address)) {
    const identity = await resolveIdentity(address);
    if (!identity) return <InvalidAddress value={address} />;
    redirect(`/card/${identity.address}`);
  }

  const wallet = normalizeAddress(address);

  const headerList = await headers();
  const verdict = await checkRateLimit(
    "card",
    LIMIT_PER_HOUR,
    new Request("https://local/card", { headers: headerList }),
  );
  if (!verdict.allowed) return <RateLimited perHour={LIMIT_PER_HOUR} retryAt={verdict.reset} />;

  const [{ card }, record] = await Promise.all([
    getOrComputeCard(wallet),
    walletHistory(wallet),
  ]);
  const name = card.ensName ?? truncateAddress(card.address);
  const fought = record.wins + record.losses;

  const shareText = `${name} unlocked ${card.archetype} — LVL ${card.level}. Think your wallet can beat it?`;

  return (
    <main className="page card-page">
      <RevealSequence card={card} />

      <RecordVisit
        address={card.address}
        name={card.ensName}
        archetype={card.archetype}
        level={card.level}
      />

      <aside className="card-aside">
        <ClaimCard address={card.address} />

        <h1 className="display enter enter-1 mt-3 text-[clamp(34px,5vw,50px)] text-[var(--text)]">
          Think you can beat it?
        </h1>
        <p className="enter enter-2 mt-3.5 mb-6 text-[14px] leading-relaxed text-[var(--muted)]">
          Bring another wallet into the arena. Five rounds. Five powers. One winner. Every clash is
          locked by both wallets and today&rsquo;s battle seed.
        </p>

        <div className="enter enter-3">
          <AddressInput
            id="address-challenger"
            destinationPrefix={`/battle/${wallet}/`}
            label="Choose your challenger"
            cta="Enter battle"
            examples={[]}
          />

          <RandomOpponent address={wallet} level={card.level} />

          <ShareBar
            url={`/card/${wallet}`}
            text={shareText}
            download={{
              href: `/api/og/${wallet}?v=portrait`,
              filename: `${name.replace(/[^a-z0-9.-]/gi, "-")}-card.png`,
            }}
          />
        </div>

        {fought > 0 && (
          <Link
            className="card-aside__record enter enter-4"
            href={`/history/${wallet}`}
          >
            Arena record: {record.wins}W {record.losses}L · {fought} {fought === 1 ? "clash" : "clashes"} →
          </Link>
        )}

        <dl className="enter enter-4 mt-7 flex flex-wrap gap-6 border-t-2 border-[var(--line)] pt-5">
          <div>
            <dt className="text-[9px] font-bold text-[#74748a]">Battle class</dt>
            <dd className="mt-1 text-[13px] text-[var(--text)]">{card.archetype}</dd>
          </div>
          <div>
            <dt className="text-[9px] font-bold text-[#74748a]">Card rarity</dt>
            <dd className="mt-1 text-[13px] text-[var(--text)]">{card.rarity}</dd>
          </div>
          <div>
            <dt className="text-[9px] font-bold text-[#74748a]">Card ID</dt>
            <dd className="mono mt-1 text-[13px] text-[var(--text)]">{card.serial}</dd>
          </div>
        </dl>
      </aside>
    </main>
  );
}
