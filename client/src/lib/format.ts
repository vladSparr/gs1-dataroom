const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/** 2202009 → "2.1 MB". Sizes arrive as strings because they are BigInt server-side. */
export function formatBytes(input: string | number): string {
  let value = Number(input);
  if (!Number.isFinite(value) || value <= 0) return '0 B';

  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  // Bytes are never fractional; larger units read better with one decimal.
  const rounded = unit === 0 ? value : Math.round(value * 10) / 10;
  return `${rounded} ${UNITS[unit]}`;
}

/** 1 → "1 folder", 3 → "3 folders". */
export function pluralise(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
