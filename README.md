# Onchain Battle Cards

Paste an EVM wallet address, get a collectible trading card generated from that
wallet's real history on Ethereum and Base: a level, five stats, an archetype, a
rarity tier and one ability. Any two cards can then fight a deterministic,
replayable match.

Entertainment only. No stakes, no tokens, no prizes, no entry fees, no price
predictions. Nothing in this app accepts or pays out value, and no wallet
connection is needed to view a card.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in the keys you have; all are optional
npm run dev                    # http://localhost:3000
```

The app runs with **no credentials at all** — every fetcher fails soft, so you
get a valid (empty) card rather than an error page. That is the same code path
that protects production when one upstream is down. To get real cards you need
at minimum `ETHERSCAN_API_KEY`.

Apply the database schema before using persistence:

```bash
psql "$DATABASE_URL" -f lib/db/schema.sql     # or paste into the Supabase SQL editor
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | vitest — stat engine, battle engine, art generator, history parsing |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run lint` | ESLint, including the no-randomness rule for `lib/battle` |
| `npm run profile -- <address>` | Prints the derived `WalletProfile` for a wallet |
| `npm run card -- <address>` | Prints the finished card, stats and reasons |
| `npm run card -- --fixtures` | Same, for the six built-in fixtures — needs no keys |

---

## Architecture

The layering is a hard rule, not a preference. Violations are bugs.

```
lib/chain/**    I/O only. API clients, a per-chain source selector, and one
                normalizer. No scoring.
lib/stats/**    PURE. No fetch, no Date.now(), no process.env, no randomness.
lib/battle/**   PURE and DETERMINISTIC. Math.random() is banned here.
lib/art/**      PURE. Deterministic SVG from the address bytes.
lib/flavor/**   LLM text with a static fallback. Cached by card shape.
lib/server/**   Composition: cache -> profile -> stats -> flavor -> persist.
components/**   Presentational. No data fetching, no business logic.
app/api/**      Thin handlers. Caching and rate limiting live here.
```

Both purity rules are enforced by tests that read the source of every file in
those directories (`lib/stats/index.test.ts`, `lib/battle/engine.test.ts`), plus
an ESLint rule that bans `Math.random` and `Date.now` under `lib/battle`.

### The pipeline

0. **`resolveIdentity(input)`** turns whatever was typed into an address. A raw
   `0x` address passes through; an ENS name or a basename is resolved against
   mainnet, with `name.base.eth` handled by the same call through CCIP-read.
   Results are cached in `api_cache` under chain `0` for a week.
1. **`buildWalletProfile(address)`** fetches both chains in parallel — normal
   transactions, ERC-20 transfers, NFT transfers, token balances, prices and a
   reverse ENS lookup — and returns *only derived metrics*. No raw API payload
   escapes this function.
2. **`computeCard(profile)`** scores five stats, maps each through a percentile
   table, derives the level, classifies the archetype, assigns an ability and
   computes rarity. Pure: same profile in, same card out.
3. **`generateFlavor(card)`** replaces the static tagline and ability line with
   model-written text, cached by card *shape*.
4. **`battle(cardA, cardB, date, nonce)`** plays five rounds from a seed derived
   from the two addresses, the UTC date and the nonce.

### Caching

- Every external API response is cached in Postgres for 24h, keyed
  `(address, chain, endpoint)`. A wallet is never fetched twice in one UTC day.
- Computed cards are cached in `wallet_cards` with the same TTL.
- `/api/og` serves the 1200x630 share image, and `?v=portrait` a 5:7 760x1064
  version behind the card page's "Save card" action — the card is a collectible,
  so it has to be saveable as the object rather than as a share banner.
- `/api/og` **reads cache only** and never triggers a chain fetch — a crawler
  unfurling a cold link must not cost a full profile build. On a miss it renders
  a generic "generate your card" image.
- There is also a per-process memo, so one request never hits Postgres twice for
  the same key.

### Finding an opponent

Generating a card is only half the loop — the other half is having someone to
fight. Three paths, in descending order of how much the visitor already knows:

- **Type an address or a name.** `/card/vitalik.eth` redirects to the canonical
  `/card/0xd8dA…`, so the shared link, the OG image and the battle URL all key
  off one address rather than off whichever spelling was typed.
- **Draw a random opponent.** `/api/random` returns a stored card, level-matched
  within ±12 where the pool allows. Reads cache only, and never returns a
  wallet that set `noIndex`.
- **Challenge from the leaderboard.** A visitor who has claimed a card gets a
  direct match link; everyone else lands on the opponent's card page.

"Claiming" a card writes the address to `localStorage` and nothing else. It is
not a login and proves nothing — anything that needs proof of ownership goes
through `/settings`, which verifies a signature. Keeping those separate is what
lets claiming be one tap with no wallet connection.

Recently viewed cards are also `localStorage` only. Which wallets someone
looked at is not something this app stores server-side.

### Match history

Every resolved match is already written to `battles`; `lib/server/history.ts`
reads it back. `/history/<address>` lists a wallet's matches with a replay link
each, and the battle page shows the head-to-head record the two wallets brought
*into* the fight — read before the current match is persisted, so it describes
the past rather than including the present.

Rounds won are derived from the stored round log rather than from `margin`,
because margin is signed from the winner's side and says nothing about who is
viewing. The parser treats the column as untrusted and degrades to zero on any
shape it does not recognise.

### Where history comes from

Etherscan V2 is multichain, but **access to chains other than Ethereum is a
paid feature**. A free key asking for Base is refused with "Free API access is
not supported for this chain" — which arrives as `status: 0` and a string
`result`, the same shape Etherscan uses for "no transactions found".

`lib/chain/history.ts` picks the source per chain. Etherscan is preferred
wherever it is allowed, because it returns calldata. On a refusal the same
history is read from Alchemy's `alchemy_getAssetTransfers`, which every chain
the app's Alchemy key has enabled will serve on the free plan.

The fallback is driven by Etherscan's own refusal, not by a hardcoded chain
list: upgrading the Etherscan plan needs no code change, because the refusal
simply stops arriving.

**What the fallback cannot see.** `getAssetTransfers` reports transfers of
value, not transactions, so there is no calldata. Two metrics are decoded from
calldata and therefore read 0 on a chain served this way:

- `openApprovalCount`
- `newContractInteractionCount` (frontier exploration in RISK)

Everything driven by transfers is fully present — trading, distinct tokens,
holdings, NFTs, memecoin share, protocol touches, first-seen date. Nothing is
estimated to fill the gap: an absent signal reads as zero rather than as an
invented number.

### Rate limiting the upstreams

Etherscan's free plan allows **5 calls/second**. One card fans out to 8 calls
across two chains and they all start at once, so without pacing roughly a third
come back throttled — and a throttled reply is `status: 0` with a string
`result`, which is indistinguishable from an empty wallet unless you match the
message. Unpaced, the same wallet scored differently on consecutive runs: 4,010
days old on one and 900 on the next.

`lib/chain/etherscan.ts` admits one request every 220ms and treats
"Max rate limit reached" as a retryable error rather than as an empty history.
Only admission is serialized, so the fan-out still overlaps.

Alchemy token metadata is capped at 6 concurrent lookups for the same reason:
40 positions times 3 retries opened ~120 sockets at once, and undici answered
with a bare `fetch failed`. Pacing it took a cold card from 102s to 8s.

### Pruning the cache

`api_cache` is the largest thing this app stores and nothing else deletes from
it, so without a prune the database quota is the first ceiling you hit — well
before any API rate limit. Two ways to run it; pick one.

**Vercel cron** (already wired). `vercel.json` calls `/api/cron/prune` daily and
the route refuses to run without `CRON_SECRET`, because Vercel cron paths are
publicly reachable.

> Hobby plans allow a cron to run **at most once per day**, and at most two per
> project. An hourly expression is rejected at deploy time and **fails the
> build**, which is why the schedule here is `0 4 * * *` rather than hourly.

Daily pruning means a row is deleted 24-48h after it was written rather than
24-25h. That costs storage headroom, never correctness: the 24h TTL is enforced
on read in `getCached`, so a stale row is ignored long before it is removed.

**Postgres pg_cron** (no plan limit, no HTTP timeout). Run this in the Supabase
SQL editor instead, and delete the `crons` block from `vercel.json`:

```sql
create extension if not exists pg_cron;

select cron.schedule('prune-api-cache', '0 * * * *', $$
  delete from api_cache
  where fetched_at < now() - interval '24 hours'
    and chain <> 0
$$);
```

`chain <> 0` is not optional in either version: name resolutions live under
chain 0 with a week-long TTL, and a 24h prune would evict entries that are
still valid.

### Resilience

Every fetcher retries three times with exponential backoff and then fails soft:
it returns empty and logs a structured warning. One dead endpoint can never stop
a card from rendering. History is capped at the 3000 most recent transactions
per address per chain.

---

## The stat engine

Each scorer takes the profile and returns `{ score, raw, reasons }`. Scores are
integers clamped to **12..99** — never 0, never 100. Levels are **1..99**.

| Stat | What it measures |
| --- | --- |
| EXPERIENCE | Wallet age, months active, transaction count (0.4 / 0.4 / 0.2) |
| TRADING | Swaps, distinct tokens, cadence, venue diversity |
| DEFI | Protocol breadth **multiplied** by category coverage, plus depth |
| HOLDING | Median hold duration, untouched share, restraint, longest hold |
| RISK | Memecoin share, leverage, unlabelled contracts, open approvals |

Two things worth knowing:

**RISK is neutral-to-positive.** It maps to damage variance in battle — a
high-RISK card swings harder in both directions. It is never phrased as a
warning or a judgment, and the reason strings are written accordingly.

**Category coverage is a multiplier, not an addend.** A wallet that has touched
six protocol categories outscores one that has hammered a single protocol forty
times. There is a test that asserts exactly this.

### Scoring method

Each scorer normalizes its sub-signals through a saturating curve
(`value / (value + half)`), weights them into a raw composite in `[0, 1]`, then
maps that through a percentile table in `baseline.json`. Absolute thresholds
always feel wrong ("is 40 swaps a lot?"); percentiles always feel right.

### Regenerating the baseline

`baseline.json` currently holds hand-written deciles. To replace them with real
population data, collect the `raw` values from cards you have computed and call
`recomputeBaselineFromRaw`:

```ts
import { recomputeBaselineFromRaw } from "@/lib/stats";

const table = recomputeBaselineFromRaw({
  experience: rawValues.map((card) => card.stats.experience.raw),
  trading: /* … */, defi: /* … */, holding: /* … */, risk: /* … */,
});
// write `table` into lib/stats/baseline.json
```

Every stat shifts when you do this, by design — the scores are relative to the
population, so a card's level is a statement about where that wallet sits among
all the wallets you have seen.

---

## The battle engine

```ts
battle(cardA, cardB, "2026-09-19", nonce);
```

Five rounds. Each round draws a stat category from a weighted distribution in
which **each card's two best stats are more likely to come up**. That is what
creates upsets and gives people a reason to rematch; a straight stat-total
comparison would be deterministic and dull. Both cards contribute to the weights
symmetrically.

Then `roll = stat + rngInt(-8, 8)` for each side, abilities apply (pre-round
stat modifiers, then post-round steals and saves), and the higher roll wins.
Ties fall to the higher level, then to the lexicographically first address —
never to argument order.

**Order independence.** The two addresses are sorted before the seed is hashed
and the cards are canonicalized before play, so `battle(A, B)` and
`battle(B, A)` produce byte-identical results, including the full round log.
This means `statA`/`rollA` in a `RoundLog` refer to the lexicographically first
address, not to the first argument — the UI maps rounds back to cards by
address.

**Rematches** increment the nonce, which changes the seed and therefore the
match, while staying fully reproducible.

### Adding an ability

Append to `ABILITIES` in `lib/stats/abilities.ts`:

```ts
{
  id: "unique_snake_case",
  name: "DISPLAY NAME",
  rarity: 4,                                   // 1 (everyone) .. 5 (a handful)
  trigger: (profile) => profile.walletAgeDays > 365,
  battleEffect: { kind: "negateFirstLoss" },
  flavorTemplate: "Held {ASSET} for {DAYS} days.",
}
```

`assignAbility` awards the **rarest qualifying** ability, breaking ties on `id`
so a wallet always gets the same one. Placeholders in `flavorTemplate` are
filled from the dictionary in `facts()`; add a key there if you need a new one.
Effect kinds are `negateFirstLoss`, `boostStat`, `stealRound`, `doubleVariance`,
`ignoreOpponentAbility` and `rerollLowest` — a new kind also needs handling in
`lib/battle/effects.ts` and `engine.ts`. The tests assert 30 abilities with
unique ids, so update the count if you add one.

### Adding an archetype

Add a centroid to `ARCHETYPE_CENTROIDS` in `lib/stats/archetypes.ts` (five
values in `[0,1]`, ordered experience, trading, defi, holding, risk), a palette
with a distinct accent in `lib/art/palettes.ts`, and a tagline in
`lib/flavor/templates.ts`. A test asserts every centroid classifies as itself,
which catches an archetype being shadowed by a neighbour.

---

## Adding a chain

1. Add the chain id to `ChainId`, `CHAIN_IDS` and `CHAIN_LABELS` in
   `types/index.ts`.
2. Add its Etherscan V2 id (the same key works — V2 is multichain), its Alchemy
   host in `lib/chain/alchemy.ts`, and its DefiLlama slug in
   `lib/chain/prices.ts`.
3. Add protocol entries for it in `data/protocols.json`.

That is the whole change; `buildWalletProfile` already fans out over
`CHAIN_IDS`. `data/protocols.json` already carries two Arbitrum entries (GMX)
that are inert until Arbitrum is enabled — GMX has no deployment on Ethereum or
Base, so it cannot be labelled on the chains currently supported.

---

## Visual system

The card is the product. If it does not look like something worth
screenshotting, nothing else matters.

- 5:7 aspect, 380px design width, deep obsidian base, one saturated archetype
  accent, a metallic frame that is brighter at the top-left.
- **Everything inside the card is sized in container units (`cqw`)**, so the
  card scales as a physical object. This is why it renders correctly at 380px on
  the card page and at 158px inside a battle replay on a phone.
- Artwork is generated deterministically from the address bytes
  (`lib/art/generate.ts`): a seeded gradient mesh, a constellation field, and a
  frame ornament whose complexity scales with rarity. No AI image generation, no
  external images, no storage — the same address always produces byte-identical
  SVG, on the server and in the browser alike.
- Rarity escalates visibly: flat, single-hue sheen, dual-hue holo, rainbow holo
  with a border pulse, then a drifting particle field at mythic.
- The holo layer tracks the pointer through `--mx/--my/--rx/--ry`, written from
  a spring-damped rAF loop rather than from `pointermove` directly, and tilts
  the card up to ±12°.

Every animation honors `prefers-reduced-motion`: transforms, tilt and particles
are disabled and fades drop under 150ms.

---

## Privacy

`/settings` lets a wallet owner set two flags, authorised by a signature from
the wallet itself (verified server-side with viem's `verifyMessage`):

- **hideNetWorth** — the card shows `???` on the page *and* in the OG image.
- **noIndex** — adds a robots noindex tag and removes the address from every
  leaderboard.

The signed message embeds the address, both flag values and a timestamp, so a
captured signature cannot be replayed to set different values or reused beyond
its ten-minute window.

Net worth is **always** displayed bucketed (`$28K`, `$1.2M`), never exact. The
leaderboard ranks by level and by win record only. **There is no net-worth
ranking and there will not be one, not even as a toggle** — how much a wallet
holds is not an achievement.

---

## Rate limits and free tiers

`/api/card` allows 20 requests per hour per IP, `/api/battle` 60, `/api/settings`
30. Limits are enforced with Upstash; if Upstash is unreachable the limiter
fails open rather than taking the product down. A limited visitor gets a themed
page, never raw 429 JSON.

**Which free tier breaks first:** Supabase, until `api_cache` is pruned — see
Future work. After that Etherscan: its free plan allows 5 calls/second and
100,000 calls/day, and each *uncached* wallet costs 4 calls on Ethereum (Base
is served by Alchemy), so roughly **25,000 new wallets per day** before you are
throttled. Repeat views are free for 24h thanks to the Postgres cache.

After that, in order: Supabase's 500MB database (the `api_cache` payloads
dominate — prune rows older than 24h, the schema indexes `fetched_at` for
exactly this), Alchemy's 300M compute units per month, then Upstash's 10,000
commands per day. DefiLlama has no key and no published hard limit. The LLM is
last by a wide margin: flavor text is cached by card *shape*
(`archetype:abilityId:levelBucket`), not by address, so there are only ~2,400
possible strings in total. After a few hundred users it costs effectively
nothing.

---

## Known simplifications

Stated plainly rather than hidden, per the build brief's "never stub" rule.
These are real implementations with real limits, not placeholders.

- **`alchemy-sdk` is not used.** It cannot be installed in this environment (it
  pulls the native `utf-8-validate` addon, which needs a C++ toolchain). The
  code calls the same `alchemy_getTokenBalances` and `alchemy_getTokenMetadata`
  JSON-RPC methods directly over `fetch`, so the data is identical.
- **Hold durations are measured from first acquisition**, not from the last time
  a position went to zero and was rebought. Reconstructing true continuous
  holding needs full balance history per token; the current figure is exact for
  the common case of a position that was accumulated and held.
- **Memecoin classification** uses a curated symbol list plus a naming pattern
  (`data/token-classes.json`). It undercounts long-tail tokens with ordinary
  names.
- **`swapCount`** counts transactions to DEX-labelled contracts rather than
  decoded swap events, so a multi-hop route counts once and a swap through an
  unlabelled aggregator is missed.
- **Protocol labelling covers ~107 contracts across 60 protocols.** This reaches
  most meaningful activity for free; unlabelled contract calls are counted as
  frontier exploration in RISK rather than being ignored.
- **Base history comes from Alchemy, not Etherscan**, because Etherscan's free
  plan covers Ethereum only. Approvals and unlabelled-contract counts are
  therefore unavailable on Base — see "Where history comes from". Upgrading the
  Etherscan plan restores them with no code change.
- **The Farcaster manifest needs `FARCASTER_ACCOUNT_ASSOCIATION`** — a
  per-domain signature from the app's custody account. Without it the link still
  renders as a frame; it just cannot be installed as a Mini App.

## Future work

Ideas deliberately **not** built, recorded here instead:

- Populate `baseline.json` from real card data once enough wallets exist.
- Decode swap events properly rather than inferring them from the `to` address.
- Per-category protocol transaction counts, which would let DEFI distinguish
  depth within a category from depth on one contract.
- Server-side image caching for OG responses, which currently re-render per
  request.
- Batched pruning. The daily delete is one statement; at high volume it would
  be better to page through the backlog, or to move it into pg_cron entirely.
