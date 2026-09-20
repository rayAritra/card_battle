import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Minimal .env reader for the CLI scripts.
 *
 * Next.js loads these itself; `tsx scripts/*.ts` does not, and we do not want a
 * dotenv dependency just for three scripts.
 *
 * Files are read in Next's own precedence order — `.env.local` wins over
 * `.env` — because a key set in one and not the other is the common case, and
 * reading only one of them silently produces an empty profile that looks like
 * a dead API key rather than a missing file.
 */
const DEFAULT_FILES = [".env.local", ".env"] as const;

export function loadEnv(files: readonly string[] = DEFAULT_FILES): void {
  for (const file of files) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;

    for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line === "" || line.startsWith("#")) continue;

      const eq = line.indexOf("=");
      if (eq === -1) continue;

      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // First file to define a key wins, and a blank value is not a definition.
      if (value !== "" && process.env[key] === undefined) process.env[key] = value;
    }
  }
}
