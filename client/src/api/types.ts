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

export interface FileItem {
  id: string;
  name: string;
  /** BigInt over the wire; parse with Number(). */
  size: string;
  mimeType: string;
  folderId: string;
  dataRoomId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Folders and files stay separate: they sort differently and carry different
 * columns, so merging them would buy nothing.
 */
export interface FolderChildren {
  folders: Folder[];
  files: FileItem[];
  nextCursor: string | null;
}

/** Everything the browser needs to PUT bytes straight to storage. */
export interface UploadTicket {
  fileId: string;
  /** Resolved server-side — may differ from the name that was requested. */
  name: string;
  uploadUrl: string;
  token: string;
}

export interface DownloadUrl {
  url: string;
  expiresAt: string;
}

/** Flat folder list for the move picker, ordered so parents precede children. */
export interface RoomFolder {
  id: string;
  name: string;
  depth: number;
  parentId: string | null;
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
