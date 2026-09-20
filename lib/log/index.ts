type Level = "info" | "warn" | "error";

/** Single structured-logging entry point so Vercel logs stay greppable. */
export function log(level: Level, scope: string, fields: Record<string, unknown> = {}): void {
  // Caller fields are nested, never spread: a field named `level` must not be
  // able to overwrite the log level.
  const line = JSON.stringify({ level, scope, at: new Date().toISOString(), data: fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/**
 * A readable message for anything that was thrown or returned as an error.
 *
 * Plain objects are handled explicitly because the two error shapes this app
 * sees most are not Errors: Supabase returns `{ code, message, details, hint }`
 * and JSON-RPC returns `{ code, message }`. `String(error)` renders both as
 * "[object Object]", which turns a precise failure into an unreadable log line.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    const message = typeof record.message === "string" ? record.message : null;
    const code =
      typeof record.code === "string" || typeof record.code === "number"
        ? String(record.code)
        : null;
    const details = typeof record.details === "string" ? record.details : null;

    if (message) {
      const parts = [code ? `[${code}]` : null, message, details].filter(Boolean);
      return parts.join(" ");
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "[unserializable error]";
    }
  }

  return String(error);
}
