import { AddressInput } from "./AddressInput";
import { truncateAddress } from "@/lib/utils/format";

/** Shown when the URL carries something that is not an EVM address. */
export function InvalidAddress({ value }: { value: string }) {
  return (
    <main className="page state-page">
      <h1 className="state-page__title display enter enter-1">The chain knows no such wallet</h1>
      <p className="state-page__copy enter enter-2">
        <span className="mono">{truncateAddress(value)}</span> could not be found. Enter a valid EVM
        address or ENS name to continue.
      </p>
      <AddressInput id="address-invalid" cta="Try another wallet" />
    </main>
  );
}
