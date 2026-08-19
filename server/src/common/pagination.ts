export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export function toPage<T extends { id: string }>(
  items: T[],
  limit: number,
): Page<T> {
  const complete = items.length === limit;

  return {
    items,
    nextCursor: complete ? items[items.length - 1].id : null,
  };
}
