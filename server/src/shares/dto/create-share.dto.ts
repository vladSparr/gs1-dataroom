import { ShareMode, ShareTargetType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateShareDto {
  @IsEnum(ShareTargetType)
  targetType!: ShareTargetType;

  @IsUUID()
  targetId!: string;

  @IsEnum(ShareMode)
  mode!: ShareMode;

  /** Required for RESTRICTED; ignored for a public link. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  // Normalised here so the grant lookup at access time is a plain equality
  // test rather than a case-insensitive one.
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? (value as unknown[]).map((entry) =>
          typeof entry === 'string' ? entry.trim().toLowerCase() : entry,
        )
      : value,
  )
  emails?: string[];
}
