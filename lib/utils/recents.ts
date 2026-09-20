/**
 * Recently viewed cards, stored per browser.
 *
 * Deliberately localStorage and not the database: which wallets a visitor
 * looked at is not something this app should keep server-side. Nothing here
 * is sent anywhere.
 *
 * Every access is wrapped — private windows, blocked site data and SSR all
 * make localStorage throw or vanish, and a missing convenience must never
 * break a page.
 */

const KEY = "obc:recent";
const SELF_KEY = "obc:self";
const MAX = 6;

export interface RecentCard {
  address: string;
  /** ENS name or basename when the card had one, else null. */
  name: string | null;
  archetype: string;
  level: number;
}

const isRecent = (value: unknown): value is RecentCard =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as RecentCard).address === "string" &&
  typeof (value as RecentCard).archetype === "string" &&
  typeof (value as RecentCard).level === "number";

/** The most recently viewed cards, newest first. Empty when unavailable. */
export function readRecents(): RecentCard[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRecent).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

/** Records a visit, moving an already-seen wallet back to the front. */
export function pushRecent(card: RecentCard): void {
  try {
    const address = card.address.toLowerCase();
    const next = [{ ...card, address }, ...readRecents().filter((r) => r.address !== address)];
    window.localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX)));
  } catch {
    /* storage unavailable — recents are a convenience, not a feature */
  }
}

export function clearRecents(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

/**
 * The visitor's own wallet, once they have told us which one it is.
 *
 * Used to turn "Fight" buttons around the app into one-tap actions instead of
 * a form. Never inferred — only set when someone explicitly claims a card.
 */
export function readSelf(): string | null {
  try {
    const value = window.localStorage.getItem(SELF_KEY);
    return value && value.startsWith("0x") ? value.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function writeSelf(address: string): void {
  try {
    window.localStorage.setItem(SELF_KEY, address.toLowerCase());
  } catch {
    /* storage unavailable */
  }
}

export function clearSelf(): void {
  try {
    window.localStorage.removeItem(SELF_KEY);
  } catch {
    /* nothing to do */
  }
}
