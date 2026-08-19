import { IsString, Length } from 'class-validator';
import { TrimString } from '../../common/transforms';

export class RenameRoomDto {
  @IsString()
  @TrimString()
  @Length(1, 120)
  name!: string;
}
