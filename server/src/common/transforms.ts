import { Transform } from 'class-transformer';

/**
 * Trims surrounding whitespace before validation runs, so " " fails the
 * length check instead of becoming a folder named with a space.
 */
export const TrimString = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
