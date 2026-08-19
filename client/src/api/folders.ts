import { apiFetch } from '@/lib/api';
import type {
  DeleteFolderResult,
  Folder,
  FolderChildren,
  FolderDetail,
  FolderStats,
} from './types';

export function getFolder(folderId: string): Promise<FolderDetail> {
  return apiFetch<FolderDetail>(`/folders/${folderId}`);
}

export function listChildren(
  folderId: string,
  cursor?: string,
): Promise<FolderChildren> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiFetch<FolderChildren>(`/folders/${folderId}/children${query}`);
}

export function getFolderStats(folderId: string): Promise<FolderStats> {
  return apiFetch<FolderStats>(`/folders/${folderId}/stats`);
}

export function createFolder(parentId: string, name: string): Promise<Folder> {
  return apiFetch<Folder>('/folders', {
    method: 'POST',
    body: JSON.stringify({ name, parentId }),
  });
}

export function renameFolder(folderId: string, name: string): Promise<Folder> {
  return apiFetch<Folder>(`/folders/${folderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function deleteFolder(folderId: string): Promise<DeleteFolderResult> {
  return apiFetch<DeleteFolderResult>(`/folders/${folderId}`, {
    method: 'DELETE',
  });
}
