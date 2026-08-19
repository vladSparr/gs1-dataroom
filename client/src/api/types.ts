/** Response shapes returned by the API. Mirrors the server's dto/ folders. */

export interface Me {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface Room {
  id: string;
  name: string;
  rootFolderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  dataRoomId: string;
  parentId: string | null;
  depth: number;
  createdAt: string;
  updatedAt: string;
}

export interface Breadcrumb {
  id: string;
  name: string;
}

export interface FolderDetail extends Folder {
  breadcrumbs: Breadcrumb[];
}

export interface FolderStats {
  folderCount: number;
  fileCount: number;
  /** BigInt serialised as a string; parse with Number(). */
  totalSize: string;
}

export interface DeleteFolderResult {
  deleted: FolderStats;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
