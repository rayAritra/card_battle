-- Onchain Battle Cards — Postgres schema (Supabase).
-- Apply with: psql "$DATABASE_URL" -f lib/db/schema.sql
-- or paste into the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- api_cache: every external API response, 24h TTL, keyed (address, chain, endpoint).
-- A wallet is never fetched twice in one UTC day.
-- ---------------------------------------------------------------------------
create table if not exists api_cache (
  address    text        not null,
  chain      bigint      not null,
  endpoint   text        not null,
  payload    jsonb       not null,
  fetched_at timestamptz not null default now(),
  primary key (address, chain, endpoint)
);
create index if not exists api_cache_fetched_at_idx on api_cache (fetched_at);

-- ---------------------------------------------------------------------------
-- wallet_cards: computed cards plus the wallet owner's privacy preferences.
-- ---------------------------------------------------------------------------
create table if not exists wallet_cards (
  address        text        primary key,
  card           jsonb       not null,
  computed_at    timestamptz not null default now(),
  hide_net_worth boolean     not null default false,
  no_index       boolean     not null default false
);
create index if not exists wallet_cards_level_idx
  on wallet_cards (((card ->> 'level')::int) desc);
create index if not exists wallet_cards_computed_at_idx on wallet_cards (computed_at desc);
create index if not exists wallet_cards_no_index_idx on wallet_cards (no_index);

-- ---------------------------------------------------------------------------
-- battles: one row per resolved match. Replayable from (addr_a, addr_b, date, nonce).
-- ---------------------------------------------------------------------------
create table if not exists battles (
  id         bigint generated always as identity primary key,
  addr_a     text        not null,
  addr_b     text        not null,
  date_utc   date        not null,
  nonce      integer     not null default 0,
  winner     text        not null,
  loser      text        not null,
  result     jsonb       not null,
  created_at timestamptz not null default now(),
  unique (addr_a, addr_b, date_utc, nonce)
);
create index if not exists battles_winner_idx on battles (winner);
create index if not exists battles_loser_idx on battles (loser);
create index if not exists battles_created_at_idx on battles (created_at desc);

-- ---------------------------------------------------------------------------
-- flavor_cache: LLM output keyed by archetype:ability:levelBucket — never by address.
-- ---------------------------------------------------------------------------
create table if not exists flavor_cache (
  cache_key  text        primary key,
  text       jsonb       not null,
  created_at timestamptz not null default now()
);
create index if not exists flavor_cache_created_at_idx on flavor_cache (created_at desc);
