import { AddressInput } from "./AddressInput";
import { truncateAddress } from "@/lib/utils/format";

/** Shown when the URL carries something that is not an EVM address. */
export function InvalidAddress({ value }: { value: string }) {
  return (
    <main className="page state-page">
      <p className="eyebrow">Not an address</p>
      <h1 className="state-page__title display">No such wallet</h1>
      <p className="state-page__copy">
        <span className="mono">{truncateAddress(value)}</span> is not a valid EVM address. It should
        start with 0x and be 42 characters long.
      </p>
      <AddressInput cta="Generate card" />
    </main>
  );
}
