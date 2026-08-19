import { IsString, Length } from 'class-validator';
import { TrimString } from '../../common/transforms';

export class RenameFileDto {
  @IsString()
  @TrimString()
  @Length(1, 255)
  name!: string;
}
