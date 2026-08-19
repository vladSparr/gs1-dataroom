/**
 * `GET /api/rooms/:id/folders` — every folder in the room, flat and ordered by
 * path so the caller can indent by `depth` without building a tree.
 */
export interface RoomFolderDto {
  id: string;
  name: string;
  depth: number;
  parentId: string | null;
}
