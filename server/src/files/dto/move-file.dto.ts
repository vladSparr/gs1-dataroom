import { IsUUID } from 'class-validator';

export class MoveFileDto {
  @IsUUID()
  folderId!: string;
}
