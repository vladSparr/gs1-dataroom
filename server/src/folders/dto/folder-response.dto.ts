import type { FileResponseDto } from '../../files/dto/file-response.dto';

/** A single crumb in the ancestor chain, root first. */
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

/** `GET /api/folders/:id` — the folder plus its full ancestor chain. */
export interface FolderDetailDto extends FolderResponseDto {
  breadcrumbs: BreadcrumbDto[];
}

/**
 * `GET /api/folders/:id/children` — two arrays rather than one merged list.
 * Folders always sort before files, they carry different columns, and merging
 * them would mean a hand-rolled comparator across two tables for no gain.
 * The cursor walks that same order: folders first, then files.
 */
export interface FolderChildrenDto {
  folders: FolderResponseDto[];
  files: FileResponseDto[];
  nextCursor: string | null;
}

/** `GET /api/folders/:id/stats` — totals for the whole subtree. */
export interface FolderStatsDto {
  folderCount: number;
  fileCount: number;
  totalSize: string; // BigInt, serialised as a string
}

/** `DELETE /api/folders/:id` — what the deletion actually removed. */
export interface DeleteFolderResultDto {
  deleted: FolderStatsDto;
}
