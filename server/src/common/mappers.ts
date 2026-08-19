import type { File, Folder } from '@prisma/client';
import type { FileResponseDto } from '../files/dto/file-response.dto';
import type { FolderResponseDto } from '../folders/dto/folder-response.dto';

export function toFileResponse(file: File): FileResponseDto {
  return {
    id: file.id,
    name: file.name,
    size: file.size.toString(),
    mimeType: file.mimeType,
    folderId: file.folderId,
    dataRoomId: file.dataRoomId,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

export function toFolderResponse(folder: Folder): FolderResponseDto {
  return {
    id: folder.id,
    name: folder.name,
    dataRoomId: folder.dataRoomId,
    parentId: folder.parentId,
    depth: folder.depth,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}

export function ancestorIds(path: string): string[] {
  return path.split('/').filter(Boolean).slice(1);
}
