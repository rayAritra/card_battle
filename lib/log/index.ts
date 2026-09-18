type Level = "info" | "warn" | "error";

/** Single structured-logging entry point so Vercel logs stay greppable. */
export function log(level: Level, scope: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ level, scope, at: new Date().toISOString(), ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
