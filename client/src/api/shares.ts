import { apiFetch } from '@/lib/api';
import type {
  DownloadUrl,
  FileItem,
  PublicFolderView,
  PublicShare,
  Share,
  ShareMode,
  ShareTargetType,
  SharedWithMeItem,
} from './types';

// --- owner side -----------------------------------------------------------

export function createShare(input: {
  targetType: ShareTargetType;
  targetId: string;
  mode: ShareMode;
  emails?: string[];
}): Promise<Share> {
  return apiFetch<Share>('/shares', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listShares(
  targetType: ShareTargetType,
  targetId: string,
): Promise<Share[]> {
  return apiFetch<Share[]>(
    `/shares?targetType=${targetType}&targetId=${targetId}`,
  );
}

export function revokeShare(shareId: string): Promise<void> {
  return apiFetch<void>(`/shares/${shareId}`, { method: 'DELETE' });
}

export function listSharedWithMe(): Promise<SharedWithMeItem[]> {
  return apiFetch<SharedWithMeItem[]>('/shared-with-me');
}

// --- recipient side -------------------------------------------------------
// These still go through apiFetch: it attaches the session token when there
// is one, which is exactly what a restricted link needs, and sends nothing
// when the visitor is signed out.

export function getPublicShare(token: string): Promise<PublicShare> {
  return apiFetch<PublicShare>(`/public/${token}`);
}

export function listPublicFolder(
  token: string,
  folderId: string,
): Promise<PublicFolderView> {
  return apiFetch<PublicFolderView>(
    `/public/${token}/folders/${folderId}/children`,
  );
}

export function getPublicFile(
  token: string,
  fileId: string,
): Promise<FileItem> {
  return apiFetch<FileItem>(`/public/${token}/files/${fileId}`);
}

export function getPublicDownloadUrl(
  token: string,
  fileId: string,
): Promise<DownloadUrl> {
  return apiFetch<DownloadUrl>(`/public/${token}/files/${fileId}/download-url`);
}

/** The URL handed to a recipient. */
export function shareLink(token: string): string {
  return `${window.location.origin}/s/${token}`;
}
