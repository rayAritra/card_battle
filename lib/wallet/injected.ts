/** The minimal EIP-1193 surface we need. No wallet library required. */
export interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

/** The injected browser wallet (MetaMask, Rabby, Coinbase extension, etc), if any. */
export function injectedProvider(): Eip1193Provider | null {
  const injected = (window as unknown as { ethereum?: Eip1193Provider })
    .ethereum;
  return injected ?? null;
}
