import { IsInt, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TrimString } from '../../common/transforms';

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export class CreateUploadDto {
  @IsUUID()
  folderId!: string;

  @IsString()
  @TrimString()
  @Length(1, 255)
  name!: string;

  /** The client's estimate, used only to enforce the limit up front. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES)
  size!: number;

  @IsString()
  @Length(1, 255)
  mimeType!: string;
}
