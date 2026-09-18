import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Battle outcomes must be reproducible from (addresses, date, nonce) alone.
    files: ["lib/battle/**/*.ts"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "Battles must use the seeded RNG in lib/battle/rng.ts.",
        },
        {
          object: "Date",
          property: "now",
          message: "Battles must take the date as an argument, never read the clock.",
        },
      ],
    },
  },
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**"],
  },
];

export default config;
