import { IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_FILE_SIZE_BYTES } from './create-upload.dto';

export class CompleteUploadDto {
  /** Authoritative size, measured after the transfer. */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_FILE_SIZE_BYTES)
  size!: number;
}
