import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { log, errorMessage } from "@/lib/log";

/**
 * Per-IP rate limiting on Upstash.
 *
 * With no Upstash credentials the limiter is disabled rather than failing
 * closed — a missing side-channel must not take the app down in development.
 */

let redis: Redis | null | undefined;

function client(): Redis | null {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;

  return redis;
}

const limiters = new Map<string, Ratelimit>();

function limiter(name: string, perHour: number): Ratelimit | null {
  const connection = client();
  if (!connection) return null;

  const existing = limiters.get(name);
  if (existing) return existing;

  const created = new Ratelimit({
    redis: connection,
    limiter: Ratelimit.slidingWindow(perHour, "1 h"),
    prefix: `obc:${name}`,
    analytics: false,
  });
  limiters.set(name, created);
  return created;
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "anonymous";
}

export interface RateVerdict {
  allowed: boolean;
  remaining: number;
  /** Unix ms when the window resets. */
  reset: number;
}

export async function checkRateLimit(
  name: string,
  perHour: number,
  request: Request,
): Promise<RateVerdict> {
  const instance = limiter(name, perHour);
  if (!instance) return { allowed: true, remaining: perHour, reset: Date.now() };

  try {
    const { success, remaining, reset } = await instance.limit(clientIp(request));
    return { allowed: success, remaining, reset };
  } catch (error) {
    // A limiter outage must not become an outage of the product.
    log("warn", "ratelimit.unavailable", { name, error: errorMessage(error) });
    return { allowed: true, remaining: perHour, reset: Date.now() };
  }
}
