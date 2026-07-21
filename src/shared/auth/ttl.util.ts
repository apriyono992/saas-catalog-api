const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Parses simple TTL strings like "15m", "7d", "1h" into milliseconds. */
export function parseTtlToMs(ttl: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(ttl.trim());
  if (!match) {
    throw new Error(`Invalid TTL format: "${ttl}"`);
  }

  const [, value, unit] = match;
  return Number(value) * UNIT_MS[unit];
}
