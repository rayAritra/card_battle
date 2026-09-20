import type { ChainId } from "@/types";
import { log } from "@/lib/log";
import * as alchemy from "./alchemy-history";
import * as etherscan from "./etherscan";
import { CHAIN_UNSUPPORTED } from "./etherscan";
import type { RawNftTransfer, RawTokenTransfer, RawTx } from "./shared";

/**
 * Wallet history, from whichever source can actually serve the chain.
 *
 * Etherscan is preferred wherever it is allowed: it returns calldata, which is
 * what makes open approvals and unlabelled-contract exploration measurable.
 * When a free key is refused a chain — which is what happens on Base today —
 * the same history is read from Alchemy instead, so the app keeps both chains
 * on free plans rather than quietly becoming Ethereum-only.
 *
 * The fallback is driven by Etherscan's own refusal rather than by a hardcoded
 * chain list, so upgrading the Etherscan plan needs no code change: the
 * refusal stops arriving and the richer source is used again automatically.
 *
 * Which chains fell back is remembered per process only as a log-noise guard.
 * It is never used to skip the Etherscan call, precisely so that a plan change
 * takes effect on the next deploy without anyone editing this file.
 */

const announced = new Set<ChainId>();

function announceFallback(chainId: ChainId, endpoint: string): void {
  if (announced.has(chainId)) return;
  announced.add(chainId);
  log("info", "history.fallback", {
    chain: chainId,
    endpoint,
    source: "alchemy",
    reason: "etherscan plan does not cover this chain",
  });
}

export async function getTransactions(address: string, chainId: ChainId): Promise<RawTx[]> {
  const rows = await etherscan.getTransactions(address, chainId);
  if (rows !== CHAIN_UNSUPPORTED) return rows;

  announceFallback(chainId, "txlist");
  return alchemy.getTransactions(address, chainId);
}

export async function getTokenTransfers(
  address: string,
  chainId: ChainId,
): Promise<RawTokenTransfer[]> {
  const rows = await etherscan.getTokenTransfers(address, chainId);
  if (rows !== CHAIN_UNSUPPORTED) return rows;

  announceFallback(chainId, "tokentx");
  return alchemy.getTokenTransfers(address, chainId);
}

export async function getNftTransfers(
  address: string,
  chainId: ChainId,
): Promise<RawNftTransfer[]> {
  const rows = await etherscan.getNftTransfers(address, chainId);
  if (rows !== CHAIN_UNSUPPORTED) return rows;

  announceFallback(chainId, "tokennfttx");
  return alchemy.getNftTransfers(address, chainId);
}

export async function getFirstTxTimestamp(address: string, chainId: ChainId): Promise<number> {
  const timestamp = await etherscan.getFirstTxTimestamp(address, chainId);
  if (timestamp !== CHAIN_UNSUPPORTED) return timestamp;

  announceFallback(chainId, "firsttx");
  return alchemy.getFirstTxTimestamp(address, chainId);
}
