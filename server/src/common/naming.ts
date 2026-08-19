/**
 * Resolves a name collision the way a file manager does:
 * `Report` → `Report (2)` → `Report (3)`.
 *
 * The caller decides what counts as the base — folders pass the whole name,
 * while step 04 splits a filename on its extension and passes the stem, so
 * `Report.pdf` becomes `Report (2).pdf` rather than `Report.pdf (2)`.
 */
export function nextAvailableName(base: string, taken: Set<string>): string {
  if (!taken.has(base)) {
    return base;
  }

  // Bounded so a pathological set cannot spin forever; the caller's unique
  // constraint is the real guarantee.
  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = `${base} (${suffix})`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Could not find a free name for "${base}"`);
}

/** Splits `Report.pdf` into `["Report", ".pdf"]`, leaving dotfiles intact. */
export function splitExtension(fileName: string): [string, string] {
  const dot = fileName.lastIndexOf('.');

  if (dot <= 0 || dot === fileName.length - 1) {
    return [fileName, ''];
  }
  return [fileName.slice(0, dot), fileName.slice(dot)];
}
