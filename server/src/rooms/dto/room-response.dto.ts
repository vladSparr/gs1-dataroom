/** A Data Room as the client sees it, with its root folder resolved. */
export interface RoomResponseDto {
  id: string;
  name: string;
  rootFolderId: string;
  createdAt: Date;
  updatedAt: Date;
}
