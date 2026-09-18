/**
 * Net worth is ALWAYS displayed bucketed, never exact — see §3 NUMBERS.
 * Buckets are coarse on purpose: "$28K", "$1.2M".
 */
export function bucketNetWorth(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return "—";
  if (usd < 1_000) return "< $1K";
  if (usd < 10_000) return `$${Math.round(usd / 1_000)}K`;
  if (usd < 1_000_000) return `$${Math.round(usd / 1_000)}K`;
  if (usd < 10_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd < 1_000_000_000) return `$${Math.round(usd / 1_000_000)}M`;
  return `$${(usd / 1_000_000_000).toFixed(1)}B`;
}

export const truncateAddress = (address: string): string =>
  address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;

export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export const formatCount = (n: number): string => Math.round(n).toLocaleString("en-US");

/** "1,847 days" style durations, rounded to whole days. */
export function formatDays(days: number): string {
  const d = Math.max(0, Math.round(days));
  return `${formatCount(d)} day${d === 1 ? "" : "s"}`;
}

export const formatPercent = (fraction: number): string =>
  `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`;

/** Today in UTC as YYYY-MM-DD. The battle seed's date component. */
export const utcDate = (at: Date = new Date()): string => at.toISOString().slice(0, 10);
