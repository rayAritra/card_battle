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
    "Onchain Battle Cards — privacy preferences",
    "",
    `Wallet: ${address.toLowerCase()}`,
    `Seal displayed vault value: ${hideNetWorth ? "yes" : "no"}`,
    `Leave rankings and discovery: ${noIndex ? "yes" : "no"}`,
    `Issued at: ${new Date(issuedAt).toISOString()}`,
    "",
    "This free signature sends no transaction and grants no permissions.",
  ].join("\n");
}
