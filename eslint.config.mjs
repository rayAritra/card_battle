import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTs from "eslint-config-next/typescript.js";
export default defineConfig([...nextVitals,...nextTs,{files:["lib/battle/**/*.{ts,tsx}"],rules:{"no-restricted-properties":["error",{"object":"Math","property":"random","message":"Battles must use seeded RNG."}]}},globalIgnores([".next/**","out/**","build/**","next-env.d.ts"])]);
