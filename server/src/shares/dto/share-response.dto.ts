import type { ShareMode, ShareRole, ShareTargetType } from '@prisma/client';
import type { FileResponseDto } from '../../files/dto/file-response.dto';
import type {
  FolderResponseDto,
  BreadcrumbDto,
} from '../../folders/dto/folder-response.dto';

/** An active share as its owner sees it. */
export interface ShareResponseDto {
  id: string;
  token: string;
  targetType: ShareTargetType;
  targetId: string;
  mode: ShareMode;
  role: ShareRole;
  /** Emails the share was granted to; empty for a public link. */
  grantedTo: string[];
  createdAt: Date;
}

/** A row on the "Shared with me" page. */
export interface SharedWithMeItemDto {
  shareId: string;
  token: string;
  targetType: ShareTargetType;
  targetId: string;
  /** Name of the shared room, folder or file. */
  name: string;
  roomName: string;
  ownerName: string | null;
  sharedAt: Date;
}

/** `GET /api/public/:token` — what the link actually opens onto. */
export interface PublicShareDto {
  targetType: ShareTargetType;
  mode: ShareMode;
  /** Name of the shared item itself. */
  name: string;
  ownerName: string | null;
  /** Where a folder or room share starts browsing. Null for a file share. */
  rootFolderId: string | null;
  /** Set only when a single file was shared. */
  file: FileResponseDto | null;
}

/**
 * `GET /api/public/:token/folders/:id/children` — same shape as the private
 * listing, plus the crumbs that stay inside the shared subtree.
 */
export interface PublicFolderViewDto {
  id: string;
  name: string;
  breadcrumbs: BreadcrumbDto[];
  folders: FolderResponseDto[];
  files: FileResponseDto[];
  nextCursor: string | null;
}
