const LOCAL = "http://localhost:3000";

const clean = (value: string | undefined): string => (value ?? "").trim().replace(/\/+$/, "");

/**
 * The absolute origin used for OG images, share links and frame targets.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_APP_URL, when it is actually set to something
 *   2. the Vercel-provided deployment host
 *   3. localhost
 *
 * Every step is treated as *possibly empty*, not merely possibly undefined.
 * A platform env var that is declared but blank arrives as "", which `??`
 * happily passes through — and `new URL("")` throws, which fails the build
 * during page-data collection rather than at runtime.
 */
export function appOrigin(): string {
  const explicit = clean(process.env.NEXT_PUBLIC_APP_URL);
  if (explicit !== "") {
    const withScheme = /^https?:\/\//.test(explicit) ? explicit : `https://${explicit}`;
    if (isValidUrl(withScheme)) return withScheme;
  }

  const vercelHost = clean(process.env.NEXT_PUBLIC_VERCEL_URL) || clean(process.env.VERCEL_URL);
  if (vercelHost !== "") {
    const candidate = `https://${vercelHost.replace(/^https?:\/\//, "")}`;
    if (isValidUrl(candidate)) return candidate;
  }

  return LOCAL;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/** The origin as a URL object, for Next's `metadataBase`. Never throws. */
export const appOriginUrl = (): URL => new URL(appOrigin());
