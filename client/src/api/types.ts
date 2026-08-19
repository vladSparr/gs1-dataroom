
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
  size: string;
  mimeType: string;
  folderId: string;
  dataRoomId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolderChildren {
  folders: Folder[];
  files: FileItem[];
  nextCursor: string | null;
}

export interface UploadTicket {
  fileId: string;
  name: string;
  uploadUrl: string;
  token: string;
}

export interface DownloadUrl {
  url: string;
  expiresAt: string;
}

export interface RoomFolder {
  id: string;
  name: string;
  depth: number;
  parentId: string | null;
}

export interface FolderStats {
  folderCount: number;
  fileCount: number;
  totalSize: string;
}

export interface DeleteFolderResult {
  deleted: FolderStats;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export type ShareTargetType = 'DATA_ROOM' | 'FOLDER' | 'FILE';
export type ShareMode = 'PUBLIC_LINK' | 'RESTRICTED';

export interface Share {
  id: string;
  token: string;
  targetType: ShareTargetType;
  targetId: string;
  mode: ShareMode;
  role: 'VIEWER' | 'EDITOR';
  grantedTo: string[];
  createdAt: string;
}

export interface SharedWithMeItem {
  shareId: string;
  token: string;
  targetType: ShareTargetType;
  targetId: string;
  name: string;
  roomName: string;
  ownerName: string | null;
  sharedAt: string;
}

export interface PublicShare {
  targetType: ShareTargetType;
  mode: ShareMode;
  name: string;
  ownerName: string | null;
  rootFolderId: string | null;
  file: FileItem | null;
}

export interface PublicFolderView {
  id: string;
  name: string;
  breadcrumbs: Breadcrumb[];
  folders: Folder[];
  files: FileItem[];
  nextCursor: string | null;
}
