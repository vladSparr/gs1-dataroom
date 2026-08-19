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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? (value as unknown[]).map((entry) =>
          typeof entry === 'string' ? entry.trim().toLowerCase() : entry,
        )
      : value,
  )
  emails?: string[];
}
