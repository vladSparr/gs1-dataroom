import type { File, Folder } from '@prisma/client';
import type { FileResponseDto } from '../files/dto/file-response.dto';
import type { FolderResponseDto } from '../folders/dto/folder-response.dto';

/** Row-to-DTO mappers shared by every service that returns these shapes. */

export function toFileResponse(file: File): FileResponseDto {
  return {
    id: file.id,
    name: file.name,
    // BigInt cannot be serialised directly; the client parses it back.
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

/**
 * The ancestor ids encoded in a folder path, room id excluded. The chain ends
 * with the folder itself, because its own id is the last segment.
 */
export function ancestorIds(path: string): string[] {
  return path.split('/').filter(Boolean).slice(1);
}
