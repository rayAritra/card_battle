import { describe, expect, it } from "vitest";
import { roundsWonBy } from "./history";

const ADDRESS = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const OTHER = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const round = (winner: string) => ({ winner });

/**
 * roundsWonBy parses a jsonb column, so every input here is something the
 * database could actually hand back — including rows written by an older
 * shape of the battle engine.
 */
describe("roundsWonBy", () => {
  it("counts only the rounds the given address won", () => {
    const result = { rounds: [round(ADDRESS), round(OTHER), round(ADDRESS)] };
    expect(roundsWonBy(result, ADDRESS)).toEqual({ won: 2, played: 3 });
  });

  it("is case-insensitive, because stored winners are not normalized", () => {
    const result = { rounds: [round(ADDRESS.toUpperCase()), round(OTHER)] };
    expect(roundsWonBy(result, ADDRESS)).toEqual({ won: 1, played: 2 });
  });

  it("reports a clean loss rather than throwing", () => {
    const result = { rounds: [round(OTHER), round(OTHER)] };
    expect(roundsWonBy(result, ADDRESS)).toEqual({ won: 0, played: 2 });
  });

  it.each([
    ["null", null],
    ["a string", "not an object"],
    ["an object with no rounds", { winner: ADDRESS }],
    ["rounds that are not an array", { rounds: "five" }],
  ])("degrades to zero for %s", (_label, input) => {
    expect(roundsWonBy(input, ADDRESS)).toEqual({ won: 0, played: 0 });
  });

  it("skips malformed rounds but still counts them as played", () => {
    const result = { rounds: [round(ADDRESS), null, { winner: 7 }] };
    expect(roundsWonBy(result, ADDRESS)).toEqual({ won: 1, played: 3 });
  });
});
