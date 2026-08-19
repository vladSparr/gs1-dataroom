import type { ShareMode, ShareRole, ShareTargetType } from '@prisma/client';
import type { FileResponseDto } from '../../files/dto/file-response.dto';
import type {
  FolderResponseDto,
  BreadcrumbDto,
} from '../../folders/dto/folder-response.dto';

export interface ShareResponseDto {
  id: string;
  token: string;
  targetType: ShareTargetType;
  targetId: string;
  mode: ShareMode;
  role: ShareRole;
  grantedTo: string[];
  createdAt: Date;
}

export interface SharedWithMeItemDto {
  shareId: string;
  token: string;
  targetType: ShareTargetType;
  targetId: string;
  name: string;
  roomName: string;
  ownerName: string | null;
  sharedAt: Date;
}

export interface PublicShareDto {
  targetType: ShareTargetType;
  mode: ShareMode;
  name: string;
  ownerName: string | null;
  rootFolderId: string | null;
  file: FileResponseDto | null;
}

export interface PublicFolderViewDto {
  id: string;
  name: string;
  breadcrumbs: BreadcrumbDto[];
  folders: FolderResponseDto[];
  files: FileResponseDto[];
  nextCursor: string | null;
}
