export function nextAvailableName(base: string, taken: Set<string>): string {
  if (!taken.has(base)) {
    return base;
  }

  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = `${base} (${suffix})`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Could not find a free name for "${base}"`);
}

export function splitExtension(fileName: string): [string, string] {
  const dot = fileName.lastIndexOf('.');

  if (dot <= 0 || dot === fileName.length - 1) {
    return [fileName, ''];
  }
  return [fileName.slice(0, dot), fileName.slice(dot)];
}
