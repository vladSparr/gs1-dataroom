import { IsString, IsUUID, Length } from 'class-validator';
import { TrimString } from '../../common/transforms';

export class CreateFolderDto {
  @IsString()
  @TrimString()
  @Length(1, 120)
  name!: string;

  @IsUUID()
  parentId!: string;
}
