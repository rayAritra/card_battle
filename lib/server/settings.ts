/** How long a settings signature stays valid. */
export const SIGNATURE_WINDOW_MS = 10 * 60 * 1000;

export interface SettingsClaim {
  address: string;
  hideNetWorth: boolean;
  noIndex: boolean;
  /** Unix ms, from the client, checked against SIGNATURE_WINDOW_MS. */
  issuedAt: number;
}

/**
 * The exact text the wallet signs.
 *
 * Shared by the browser and the verifier so the two can never drift, and
 * written to be readable in a wallet prompt: someone approving this should be
 * able to see precisely what they are agreeing to.
 */
export function settingsMessage({
  address,
  hideNetWorth,
  noIndex,
  issuedAt,
}: SettingsClaim): string {
  return [
    "Onchain Battle Cards — card settings",
    "",
    `Wallet: ${address.toLowerCase()}`,
    `Hide net worth: ${hideNetWorth ? "yes" : "no"}`,
    `Hide from leaderboard and search: ${noIndex ? "yes" : "no"}`,
    `Issued at: ${new Date(issuedAt).toISOString()}`,
    "",
    "Signing costs nothing and sends no transaction.",
  ].join("\n");
}
