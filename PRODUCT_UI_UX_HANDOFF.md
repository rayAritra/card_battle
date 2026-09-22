# Onchain Battle Cards — End-to-End Product & UI/UX Handoff

> Source-of-truth handoff prepared from the current repository. It describes the product, every visible route and state, interaction rules, data contracts, design system, responsive behavior, and the remaining integration work needed for a complete release.

## 1. Product in one sentence

Onchain Battle Cards turns any Ethereum or Base wallet into a collectible trading card based on its real public history, then lets any two wallet cards fight a deterministic, replayable five-round match.

## 2. Product promise

The emotional loop is:

1. Curiosity — “What kind of onchain character am I?”
2. Reveal — a wallet becomes a visually desirable, screenshot-worthy card.
3. Credibility — every score can be explained by real activity.
4. Competition — the card can fight another wallet.
5. Sharing — the result brings another person back into the loop.

The app is entertainment only. It has no entry fee, token, prize, wager, payout, price prediction, or required wallet connection. All analyzed data is already public onchain data.

## 3. Product principles and hard constraints

- The card is the hero product. It should feel like a physical foil collectible photographed in low light.
- A user can generate and battle cards without connecting a wallet.
- Wallet connection/signing is used only to prove ownership when changing privacy settings.
- Stats are heuristic and percentile-based, not financial advice.
- Risk is an aggressive battle characteristic, not a moral judgment or safety warning.
- Net worth is always bucketed (for example `$28K` or `$1.2M`), never exact.
- There must never be a net-worth leaderboard.
- The same inputs must always produce the same card and match result.
- The experience must remain usable if external data services fail; an empty but valid card is better than a broken page.
- All important motion must honor `prefers-reduced-motion`.

## 4. Audience

Primary:

- Crypto-native users who know an ENS name or wallet address.
- People sharing identity/status artifacts on X or Farcaster.
- Competitive users who want to compare wallet histories without staking value.

Secondary:

- Curious non-technical visitors following a shared card or battle link.
- Builders exploring public wallet behavior.

The UI may use terms such as wallet, ENS, Base, DeFi, and onchain, but every action must remain understandable without protocol expertise.

## 5. Information architecture

| Route | Purpose | Primary action |
| --- | --- | --- |
| `/` | Landing and wallet lookup | Generate card |
| `/card/:address` | Card reveal and challenge setup | Fight this wallet |
| `/battle/:a/:b?n=:nonce` | Animated five-round match and result | Rematch / share |
| `/leaderboard` | Highest levels and best records | Open a card |
| `/settings` | Signature-authorized privacy controls | Sign and save |
| `/api/og/:address` | 1200×630 social image | System-generated |
| `/api/icon` | 512×512 app icon | System-generated |

Global header:

- Logo: “Onchain / Battle Cards”; links home.
- Navigation: Leaderboard, Settings.

Global footer copy:

> Entertainment only. Stats are heuristics derived from public onchain data, not financial advice.

## 6. Primary end-to-end journeys

### Journey A — Generate a card

1. User lands on `/`.
2. User enters an EVM address, ENS name, or Basename.
3. A raw address is validated locally. A name is resolved through `/api/resolve`.
4. User is routed to `/card/:address`.
5. A face-down card loading state appears while Ethereum and Base data is read.
6. The card flips and reveals its art, archetype, level, net-worth bucket, five stats, ability, rarity, identity, chain badges, and serial.
7. Hovering or tapping a stat reveals two or three plain-language reasons.
8. The user can challenge the card, copy its link, or post it to X.

### Journey B — Start a battle

1. From a card page, the visitor enters their own wallet address/name.
2. The app routes to `/battle/:opponent/:challenger`.
3. Both cards enter the arena.
4. Five rounds play sequentially. Each round shows its stat category, base values, random deltas, winner, score progress, and any triggered ability.
5. The winner is emphasized; the loser becomes less saturated.
6. Commentary, the round log, rematch, share controls, and “Get your own card” appear.
7. Rematch increments `n`, creating a different but still reproducible result.

### Journey C — Follow a shared link

1. A social preview shows the card identity, archetype, level, stats, ability, net-worth bucket/hidden value, and “Battle this wallet.”
2. The visitor opens the card or battle directly.
3. They can challenge it without an account or wallet connection.

### Journey D — Change privacy settings

1. User opens `/settings`.
2. User selects “Hide net worth” and/or “Hide from search and the leaderboard.”
3. User clicks “Sign and save.”
4. Browser wallet requests account access and a readable message signature.
5. No transaction or gas is involved.
6. The server verifies the signature and updates only that wallet’s settings.
7. The card and OG image show `???` when net worth is hidden; `noindex` cards disappear from leaderboards and discovery but remain accessible by direct link.

## 7. Screen specifications

### 7.1 Global shell

Desktop content widths:

- Header: maximum 1180px.
- Main page: maximum 1120px.
- General horizontal padding: 22px desktop, 16px at 760px and below.
- Footer: centered, maximum 620px.

Behavior:

- Dark color scheme from the first paint.
- Fixed-feeling radial background glow over the obsidian base.
- Header stays visually light and does not compete with the card.
- Navigation links visibly respond to hover and keyboard focus.

### 7.2 Landing page `/`

Content order:

1. Eyebrow: “Generated from real onchain history”
2. H1: “Every wallet / is a card”
3. Supporting paragraph explaining level, five stats, archetype, ability, Ethereum, Base, and battle.
4. Address/ENS input with “Generate card.”
5. Three example chips: `vitalik.eth`, `Uniswap deployer`, `Base builder`.
6. Three-step explainer:
   - Read history across Ethereum and Base.
   - Score against a population baseline.
   - Fight deterministic, replayable matches.

Input behavior:

- Accept a 42-character EVM address beginning `0x`, an ENS name, or a Basename.
- Placeholder: `0x… or name.eth`.
- Submit button changes to “Reading…” while resolving/navigating.
- Example chips populate the field; they do not auto-submit.
- Invalid plain text: “Enter a wallet address starting with 0x, or an ENS name like vitalik.eth.”
- Unresolved name: “We could not find a wallet behind ‘{name}’. Check the spelling.”
- Rate-limited resolution: advise pasting an address or trying later.
- Network failure: advise pasting the address directly.

Responsive:

- Hero title scales from roughly 54px to 116px.
- At 420px and below, input and submit button stack vertically.

### 7.3 Card loading state

- Never use a generic spinner.
- Show a 5:7 face-down card with deterministic-looking generated art.
- Center copy: “Reading the chain” and truncated address.
- Show five shimmering placeholder stat lines.
- Use a slow, subtle 3D idle rotation.
- Loading should visually become the revealed card rather than feeling like a page replacement.

### 7.4 Card page `/card/:address`

Desktop layout:

- Two columns: card (300–380px) and challenge/share content (280–460px).
- 64px gap, vertically centered.

Mobile/tablet at 900px and below:

- Single column, maximum 420px.
- Card first, challenge area second.
- Challenge copy and supporting facts center-align.

Card reveal sequence:

- Initial face-down state.
- Flip completes over about 700ms.
- Frame wipe begins around 350ms.
- Archetype appears around 500ms.
- Tagline around 600ms.
- Level/net-worth and stat count-ups begin around 650–800ms.
- Stats stagger by 90ms.
- Ability arrives around 1.4s.
- Epic, legendary, and mythic cards receive a rarity sweep around 1.6s.
- Reduced-motion version is a short fade with final values already visible.

Right-side content:

- Eyebrow: “Challenge”
- H1: “Battle this wallet”
- Explain that both addresses plus today’s UTC date seed the match, and address order never changes the result.
- Challenger address/name field with CTA “Fight.”
- Copy link and Post to X.
- Facts: archetype, rarity, serial.

Card interaction:

- Pointer position tilts the card by up to ±12° and moves the foil highlight.
- On supported mobile devices, orientation may drive the effect; otherwise use quiet idle drift.
- Pointer exit returns the card to rest.
- Battle cards shown in a replay do not tilt.
- Every stat row is a real button. Hover previews reasons; tap/click pins the explanation open.

### 7.5 Battle page `/battle/:a/:b`

Preconditions:

- Both addresses must be valid.
- A wallet cannot fight itself.
- Nonce is an integer from 0 to 9,999; invalid values become 0.

Arena layout:

- Desktop: card A / center match information / card B.
- Mobile at 860px and below: two cards side by side, center match information moves above both.
- Each card has name/address and live rounds-won score.

Timeline:

- 500ms entrance.
- Each of five rounds occupies about 1.4s.
- Add a 600ms pause when an ability triggers.
- Current round category scales/fades in.
- Show each base stat and the positive/negative roll delta.
- Winner card subtly grows; losing card dims during each round.
- Ability name sweeps across the arena when triggered.
- Round pips fill using the winner’s archetype accent.
- Final winner grows to about 1.06 scale; loser desaturates.
- Show “Victory” plus winning archetype.

After the result:

- One-line mythic commentary.
- Rematch.
- Primary CTA: “Get your own card.”
- Copy link and Post to X.
- Full five-row log: round, category, roll pair, winner.

Reduced motion:

- Skip the timed replay and show the complete result/log immediately.

### 7.6 Leaderboard `/leaderboard`

Header:

- Eyebrow: “Standings”
- H1: “Leaderboard”
- Explain that ranking is only by level and battle record, never net worth.

Two responsive columns:

1. Highest level
   - Caption: weighted across all five stats, experience has the highest weight.
   - Metric: `LVL {number}`.
2. Best record
   - Caption: wins and losses across every recorded battle.
   - Metric: `{wins}W {losses}L`.

Row anatomy:

- Zero-padded rank.
- ENS/Basename if available; otherwise truncated address.
- Archetype.
- Metric.
- Clicking identity opens the card.

Empty state:

> Nothing here yet. Generate the first card and it will appear.

Rules:

- Up to 25 rows per board.
- Hidden/no-index cards never appear.
- Level ties resolve deterministically by address.
- Record sorting: most wins, then fewest losses, then higher level, then address.

### 7.7 Settings `/settings`

Content:

- Eyebrow: “Your card”
- H1: “Settings”
- Explain why a free signature is required.

Controls:

1. “Hide net worth”
   - Hint: card and social image display `???`.
2. “Hide from search and the leaderboard”
   - Hint: adds `noindex`, removes from all rankings and discovery; direct links still work.
3. Button: “Sign and save.”

Status sequence:

- No wallet: explain that a browser wallet or wallet browser is required.
- Connecting: “Waiting for your wallet…”
- Signing: “Sign the message to confirm…”
- Saving: “Saving…”
- Success: “Saved. Your card reflects this now.”
- Rejected: “Signature cancelled.”
- Other failure: plain-language inline error.

Important UX rule: this is not a transaction. Do not use transaction, gas, fee, or payment visuals.

### 7.8 Error and exceptional states

| State | Eyebrow / title | Recovery |
| --- | --- | --- |
| Invalid URL address | “Not an address” / “No such wallet” | Show format guidance and lookup field |
| Same-wallet battle | “Impossible” / “A wallet cannot fight itself” | Back to card |
| Rate limited | “Cooling” / “The forge is hot” | Show approximate retry minutes |
| Application error | “Something broke” / “The chain went quiet” | Try again / Start over |
| 404 | “404” / “No card here” | Generate a card |
| No random opponent | — | “No other cards yet. Share yours and come back.” |
| Random opponent failure | — | “Could not find an opponent just now. Try again.” |

Do not expose raw JSON, stack traces, upstream provider names, or database errors in the UI.

## 8. Card anatomy and content model

The card is always 5:7, with a 380px design width. Everything inside scales using container-relative units so the same component works at full size and as a battle thumbnail.

From top to bottom:

1. Rarity badge.
2. Active chain badges: ETH, BASE, both, or NO CHAIN.
3. ENS/Basename or truncated address.
4. Deterministic address-generated artwork.
5. Archetype.
6. Archetype tagline.
7. Level and net-worth bucket.
8. Five explainable stats.
9. Ability name, one-to-five rarity diamonds, and evidence-based flavor line.
10. Brand name and deterministic four-digit serial.

### Five stats

| Stat | Meaning | Battle role |
| --- | --- | --- |
| Experience | Wallet age, active months, transaction count | Stable veteran strength |
| Trading | Swaps, token breadth, cadence, venue diversity | Trading round strength |
| DeFi | Protocol breadth, category coverage, depth | DeFi round strength |
| Holding | Hold duration, untouched share, restraint | Holding round strength |
| Risk | Memecoin exposure, leverage, unknown contracts, approvals | Increases aggressive/variable profile |

Stat scores are integers from 12 to 99. Level is 1 to 99 and weights Experience 1.3×; the other stats are 1×.

### Rarity

Tiers: Common, Rare, Epic, Legendary, Mythic.

- Common: flat treatment.
- Rare: low-opacity, single-hue sheen.
- Epic: stronger dual/rainbow sheen.
- Legendary: stronger holo, sparkle, and pulsing border light.
- Mythic: strongest holo plus a slow drifting particle field.

Rarity is driven by level with a specialist bonus for an exceptionally high peak stat.

### Archetypes and accents

| Archetype | Accent | Fallback tagline |
| --- | --- | --- |
| Ghost Wallet | `#8FA3B0` | An address with everything still ahead of it |
| DeFi Warlord | `#FF3B5C` | Holds territory across every protocol layer |
| Diamond Whale | `#6FD3FF` | Size, and the patience to ignore it |
| Stablecoin Monk | `#3FE0A0` | Wants nothing the market can take away |
| MEV Gremlin | `#B6FF3C` | Lives in the space between blocks |
| Airdrop Farmer | `#FFB020` | Plants early, harvests without sentiment |
| Serial Aper | `#FF6B2C` | First through the door, every time |
| Liquidity Sage | `#9B7BFF` | Reads depth the way others read price |
| Bridge Nomad | `#2FE0D6` | Belongs to no single chain |
| NFT Warlock | `#FF4FD8` | Collects what cannot be replaced |
| Genesis Relic | `#E8C56A` | Older than most of what it survived |
| Cold Vault | `#6C63FF` | Quiet, sealed, and entirely intact |
| Chain Tourist | `#C9BFA3` | Has seen enough to know the terrain |
| Spot Maximalist | `#00A3FF` | Trades often, leverages never |
| Bagholder Saint | `#FF7A9C` | Conviction that outlasted the thesis |
| Cycle Veteran | `#D96A3C` | Has been early, wrong, and right in turn |

### Abilities

Each card receives exactly one ability: the rarest qualifying ability, with deterministic tie-breaking. The catalog contains 30 abilities across five rarity levels. Battle effects are limited to:

- Boost a named stat.
- Negate the first loss.
- Steal a specific round.
- Double variance.
- Ignore the opponent’s ability.
- Reroll the first unfavorable swing.

The UI needs the ability name, rarity pips, flavor/evidence line, and a battle trigger banner. It does not need to expose internal trigger math.

## 9. Battle rules the UI must represent correctly

- Exactly five rounds.
- Each round chooses one of the five stat categories.
- Each card’s two strongest stats are more likely to be selected.
- Base roll is the selected stat plus a seeded swing, normally from -8 to +8.
- Ability effects can modify the stat, variance, roll, or round result.
- Roll ties go to higher level, then lexicographically first wallet address.
- The two addresses are sorted before seeding, so reversing URL order does not change the match.
- Seed inputs are both addresses, UTC date, and rematch nonce.
- A rematch changes the nonce; reopening the same battle URL reproduces the same result.

Do not present battle outcomes as live randomness, gambling, prediction, or financial performance.

## 10. Visual design system

### Direction

“A physical foil trading card photographed in low light”: deep black surfaces, restrained metallic edges, one saturated archetype color, real depth, and minimal interface chrome.

This applies to the collectible itself (the battle card and its foil/holo/glow treatment) — not to browsing/listing surfaces. See “List and dashboard card surfaces” below, which supersedes any earlier glow/lift guidance for those.

### List and dashboard card surfaces

Any card used to *browse or summarize* — archetypes, abilities, leaderboard rows, and similar grids, as distinct from the collectible battle card itself — follows a flat dashboard-panel style, not the foil-card treatment above:

- Card background is a flat, static elevated surface (`--surface-alt`) against the pure-black page — contrast comes from that flat color difference, not from a shadow or glow.
- No box-shadow, no blur, no hover lift/translate, no glow. A hairline border only, optionally brightening slightly on hover/focus for affordance.
- A category/type marker is an icon in a small tinted rounded-square chip (`background: color-mix(in srgb, var(--accent) 16%, transparent)`, icon colored `var(--accent)`), never a plain colored dot.
- Data values use a small set of consistent, saturated “poppy” hues (blue/green/orange/red/purple work well) rather than the muted archetype accent for anything chart-like (bars, bubbles, legend dots).
- No entrance/reveal animation on the data visualization itself (bars, bubbles) — it renders in its final state immediately. The page-level `stagger-item` mount fade is still fine.
- Reference implementation: `app/archetypes/page.tsx` + `archetypes.module.css`.

### Core tokens

| Token | Value |
| --- | --- |
| Background | `#08080B` |
| Surface | `#101014` |
| Surface alt | `#16161C` |
| Primary text | `#F4F4F5` |
| Muted text | `#8A8A94` |
| Hairline | `rgba(255,255,255,.08)` |
| Strong hairline | `rgba(255,255,255,.16)` |
| Positive | `#6EE7A8` |
| Negative/error | `#FF6579` |
| Card radius | 14px |
| Inner/control radius | 6px |

Typography:

- Display: Oswald 500/600/700, uppercase, condensed, wide tracking.
- Body: Inter.
- Data/address/score: JetBrains Mono.

Buttons:

- Uppercase, 11px, heavy weight, 0.14em tracking.
- Primary: near-white background, near-black text.
- Accent: current archetype color with glow.
- Ghost: transparent with strong hairline border.
- Press interaction: scale to 0.97 for about 120ms.
- Disabled state: 45% opacity and no pointer affordance.

Focus:

- Every interactive control requires a visible keyboard focus ring.
- Use the active accent color with enough contrast against the dark surface.
- Hover cannot be the only way to reveal content; tap/click and keyboard must work.

## 11. Content style

Voice:

- Terse, confident, slightly mythic.
- Evidence-based, never accusatory.
- No emoji or exclamation marks.
- No financial advice, price talk, or predictions.
- Avoid second-person language inside card flavor text.
- Interface instructions can use “your” where clarity requires it.

Identity display order:

1. ENS/Basename.
2. Truncated wallet address.
3. Full address only in title/tooltip or detail context.

## 12. Accessibility requirements

- Target WCAG 2.2 AA for text, controls, focus states, and error communication.
- All form fields have visible labels.
- Errors use `role="alert"`; progress/success uses `role="status"` where appropriate.
- Buttons and stat rows are keyboard operable.
- Rarity, scores, and win/loss states must not rely on color alone.
- Decorative card art, holo, and sparkle remain hidden from assistive technology.
- Motion reduction disables 3D tilt, particles, looping animation, and long replays; fades stay under roughly 150ms.
- Preserve readable order on mobile: context, action, result.
- Provide touch targets of at least 44×44px in final design files, even where current code is smaller.
- Validate contrast for every archetype accent, especially lime, gold, cyan, and pale neutral accents on light button fills.

## 13. Responsive requirements

Design at minimum these frames:

- 1440px desktop.
- 1024px small desktop/tablet landscape.
- 768px tablet portrait.
- 390px mobile.
- 320px minimum supported width.

Breakpoints already reflected in code:

- 900px: card page becomes one column.
- 860px: battle arena becomes two cards with center content above.
- 760px: page/header padding tightens.
- 420px: address form and share secondary actions stack.

Critical rule: do not redesign the card separately for every placement. Preserve the same 5:7 component and scale its contents with the container.

## 14. Data and API contract summary

### Card object

The UI receives:

- `address`, optional `ensName`, active chains.
- `archetype`, `level`, `rarity`.
- Five stats; each has `score`, internal raw value, and 2–3 display reasons.
- One ability with name, rarity, effect metadata, and flavor.
- Tagline, bucketed net worth, optional hidden flag, serial, computation timestamp.

### Public endpoints

| Endpoint | Method | Use | Important states |
| --- | --- | --- | --- |
| `/api/card/:address` | GET | Fetch/compute card | 400 invalid, 429 limited, 500 failed |
| `/api/resolve?q=` | GET | Resolve address/ENS/Basename | 404 unresolved, 429 limited |
| `/api/battle` | POST | Compute/persist battle | 400 malformed/same address, 429, 500 |
| `/api/random?exclude=&level=` | GET | Find stored opponent near ±12 levels | 404 none |
| `/api/leaderboard` | GET | Load both boards | Empty arrays if unavailable |
| `/api/settings` | POST | Verify signature and save flags | 400/401/429/503/500 |
| `/api/og/:address` | GET | Social image | Generic image on cache miss |
| `/api/frame?a=` | POST | Farcaster one-tap challenge | Redirects safely |

Caching expectations:

- External wallet data and computed cards: 24 hours.
- Card API browser cache: five minutes plus stale revalidation.
- Leaderboard: one minute plus stale revalidation.
- Social image never triggers an expensive card computation; cache miss shows a generic image.

Rate limits:

- Cards: 20/hour/IP.
- Battles: 60/hour/IP.
- Settings: 30/hour/IP.
- Name resolution: 120/hour/IP.

## 15. Privacy, trust, and safety UX

- Looking up a public wallet requires no consent because the data is already public, but do not imply private knowledge.
- Never show exact portfolio value.
- Never rank by portfolio value.
- Settings signature expires after ten minutes and encodes wallet, both flags, and timestamp.
- “Hide from search” does not delete the direct-link card; copy must say this clearly.
- Recently viewed cards, when enabled, remain in browser local storage only and must have a visible Clear action.
- Claiming “This is my wallet,” when enabled, is a local convenience and not proof of ownership. Only signed settings establish control.

## 16. Social and growth surfaces

Card share text pattern:

> `{identity} is a {archetype} — level {level}. Battle this wallet.`

Battle share text pattern:

> `{winner archetype} (lvl {level}) beat {loser archetype} (lvl {level}) {score}.`

Social image is 1200×630 and contains rarity, identity, serial, archetype, tagline, level, net worth/`???`, ability, and all five stats.

Farcaster behavior:

- Shared cards expose a “Battle this wallet” frame action.
- If the frame supplies the visitor’s verified address, open a battle directly.
- If no challenger exists or it equals the target, return to the target card.

## 17. Current implementation status

### Connected and working in the visible route tree

- Landing lookup with address, ENS, and Basename support.
- Card loading and reveal.
- Deterministic art, palettes, card stats, archetype, rarity, ability, level, and serial.
- Stat reason expansion.
- Holo/tilt and reduced motion.
- Challenge-by-address battle creation.
- Five-round replay, ability banners, log, result, rematch, and sharing.
- Two leaderboard views.
- Signature-authorized privacy settings.
- Themed invalid, limit, 404, and application-error states.
- OG image, icon, and Farcaster frame metadata/redirect.

### Implemented in code but not connected to visible pages

These should be treated as remaining integration work, not assumed live behavior:

- `RecentCards`: local list of six recently viewed cards plus Clear.
- `RecordVisit`: records a card view locally.
- `ClaimCard`: “This is my wallet” local preference.
- `FightButton`: one-tap fight from a leaderboard row when a self wallet is known.
- `RandomOpponent`: finds a level-matched stored opponent and starts a battle.
- Wallet history and head-to-head data utilities.

### UX/design gaps to resolve before final release

1. Decide the final placement of recent cards on the landing page.
2. Place “This is my wallet” on the card page without implying authentication.
3. Add “Fight a random wallet” as the answer to users who do not know a second address.
4. Decide whether leaderboard rows expose a visible Fight action or only open the card.
5. Design wallet battle history and head-to-head views if they are in release scope; there is backend support but no route.
6. Add styles for the unconnected components (`recents`, `claim`, `random-opponent`, `board__fight`).
7. Make rate-limit copy context-aware: the existing shared component says “cards” even when used for battles.
8. Add explicit global `:focus-visible` styling to the final UI system.
9. Decide whether Settings should load and display existing flag values; the current form starts both unchecked.
10. Define analytics events and consent policy; no analytics layer currently exists.

## 18. Recommended complete-release flow additions

To close the loop without expanding the product beyond its existing code:

- Home: render Recently viewed below the three-step explainer only when local history exists.
- Card: record the visit, add “This is my wallet,” and place “Fight a random wallet” below the manual challenger form.
- Leaderboard: add a compact Fight action per row; if self is unknown, route through the card page.
- Battle result: add “View winner card” and “View loser card” text links for exploration.
- Settings: after wallet selection, load current values before signing changes.

These additions should remain secondary to the central generate → reveal → fight → share loop.

## 19. UI/UX delivery checklist

The design handoff should include:

- Sitemap and the four primary user-flow diagrams.
- Desktop, tablet, and mobile frames for every route.
- Card component at full size and battle-thumbnail size.
- All 16 archetype color variants.
- All five rarity treatments.
- Loading, reveal, hover, pinned-stat, disabled, success, error, empty, and rate-limit states.
- Battle storyboard: entrance, normal round, ability round, final result, reduced-motion result.
- Address input states: empty, focus, valid, invalid, resolving, unresolved, limited.
- Settings flow including no-wallet, connect, sign, cancelled, save, and saved.
- Social card at 1200×630 and app icon at 512×512.
- Component specs with spacing, type, color, radius, motion timing, and responsive rules.
- Keyboard focus order and focus visuals.
- Copy deck matching this document.
- Developer annotations showing which values are dynamic and their maximum likely lengths.

## 20. Acceptance criteria

A release is complete when:

1. A first-time user can generate a card using an address or name without connecting a wallet.
2. The loading state explains that work is happening and never shows a raw spinner/error.
3. Every finished card exposes identity, rarity, chains, art, archetype, tagline, level, net worth/hidden state, five explainable stats, ability, and serial.
4. A visitor can start a valid two-wallet battle from a card page.
5. Battle order, date, and nonce behavior match the deterministic rules.
6. All five rounds and triggered abilities are understandable without reading documentation.
7. Rematch, copy, X sharing, and get-your-own-card actions work.
8. Leaderboards never reveal or rank by net worth and exclude `noIndex` wallets.
9. Privacy changes require a valid wallet signature and make no transaction.
10. Invalid, empty, loading, limited, upstream-failure, and no-wallet states have designed recovery paths.
11. Layout works from 320px mobile through large desktop.
12. Keyboard and screen-reader users can operate every feature.
13. Reduced-motion users receive the same information without long or spatial animation.
14. Social previews respect privacy and do not trigger a cold wallet data fetch.

## 21. Technical handoff for implementation

Stack:

- Next.js 15 App Router, React 19, TypeScript.
- Framer Motion for interaction/replay animation.
- CSS/Tailwind import with project-specific global class system.
- Viem for address, ENS, and signature operations.
- Supabase/Postgres for cache, cards, battles, flavor, and privacy flags.
- Upstash for per-IP rate limits.
- Etherscan/Alchemy/DefiLlama-backed wallet analysis.

Local setup:

```bash
npm install
copy .env.example .env.local
npm run dev
```

The app can boot without credentials and degrades to empty cards. Real wallet history requires provider keys; persistence, leaderboards, privacy settings, and discovery require the database schema in `lib/db/schema.sql`.

Quality commands:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

