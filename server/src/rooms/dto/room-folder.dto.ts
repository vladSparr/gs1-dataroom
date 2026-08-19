export interface RoomFolderDto {
  id: string;
  name: string;
  depth: number;
  parentId: string | null;
}
