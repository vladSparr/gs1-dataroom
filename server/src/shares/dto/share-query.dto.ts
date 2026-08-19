import { ShareTargetType } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

/** `GET /api/shares?targetType=&targetId=` */
export class ShareQueryDto {
  @IsEnum(ShareTargetType)
  targetType!: ShareTargetType;

  @IsUUID()
  targetId!: string;
}
