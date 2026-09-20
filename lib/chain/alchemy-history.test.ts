import { describe, expect, it } from "vitest";
import { toTransfer } from "./alchemy-history";

/**
 * toTransfer parses a JSON-RPC response, so every case here is a shape the
 * provider can actually return — including the ones where fields are absent.
 * Etherscan's equivalents are decimal strings and unix seconds, so the mapping
 * has to normalize to those or the stat engine silently scores garbage.
 */
describe("toTransfer", () => {
  const full = {
    hash: "0xABC",
    from: "0xAAA",
    to: "0xBBB",
    asset: "USDC",
    category: "erc20",
    tokenId: "42",
    rawContract: { value: "0x3b9aca00", address: "0xCCC", decimal: "0x6" },
    metadata: { blockTimestamp: "2026-05-19T03:02:47.000Z" },
  };

  it("converts the hex value to a decimal string, as Etherscan reports it", () => {
    expect(toTransfer(full).rawValue).toBe("1000000000");
  });

  it("converts the ISO timestamp to unix seconds", () => {
    expect(toTransfer(full).timestamp).toBe(1779159767);
  });

  it("lowercases addresses so they match the protocol index", () => {
    const transfer = toTransfer(full);
    expect(transfer.from).toBe("0xaaa");
    expect(transfer.to).toBe("0xbbb");
    expect(transfer.contract).toBe("0xccc");
  });

  it("decodes hex decimals", () => {
    expect(toTransfer(full).decimals).toBe("6");
  });

  it("defaults decimals to 18 when the field is absent", () => {
    expect(toTransfer({ ...full, rawContract: { value: "0x1", address: "0xCCC" } }).decimals).toBe(
      "18",
    );
  });

  it("falls back to erc721TokenId when tokenId is absent", () => {
    const rest = { ...full, tokenId: undefined };
    expect(toTransfer({ ...rest, erc721TokenId: "7" }).tokenId).toBe("7");
  });

  it("yields zero rather than NaN for a missing value", () => {
    expect(toTransfer({ ...full, rawContract: {} }).rawValue).toBe("0");
  });

  it("yields zero rather than NaN for a missing timestamp", () => {
    expect(toTransfer({ ...full, metadata: {} }).timestamp).toBe(0);
  });

  it("survives a row with nothing on it at all", () => {
    const transfer = toTransfer({});
    expect(transfer.rawValue).toBe("0");
    expect(transfer.timestamp).toBe(0);
    expect(transfer.decimals).toBe("18");
  });
});
