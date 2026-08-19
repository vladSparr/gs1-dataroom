import { ShareTargetType } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class ShareQueryDto {
  @IsEnum(ShareTargetType)
  targetType!: ShareTargetType;

  @IsUUID()
  targetId!: string;
}
