import type { FileResponseDto } from '../../files/dto/file-response.dto';

export interface BreadcrumbDto {
  id: string;
  name: string;
}

export interface FolderResponseDto {
  id: string;
  name: string;
  dataRoomId: string;
  parentId: string | null;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderDetailDto extends FolderResponseDto {
  breadcrumbs: BreadcrumbDto[];
}

export interface FolderChildrenDto {
  folders: FolderResponseDto[];
  files: FileResponseDto[];
  nextCursor: string | null;
}

export interface FolderStatsDto {
  folderCount: number;
  fileCount: number;
  totalSize: string;
}

export interface DeleteFolderResultDto {
  deleted: FolderStatsDto;
}
