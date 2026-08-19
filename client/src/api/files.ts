import { apiFetch } from '@/lib/api';
import type { DownloadUrl, FileItem, UploadTicket } from './types';

export function createUploadTicket(input: {
  folderId: string;
  name: string;
  size: number;
  mimeType: string;
}): Promise<UploadTicket> {
  return apiFetch<UploadTicket>('/files/upload-url', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function completeUpload(
  fileId: string,
  size: number,
): Promise<FileItem> {
  return apiFetch<FileItem>(`/files/${fileId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ size }),
  });
}

export function getDownloadUrl(fileId: string): Promise<DownloadUrl> {
  return apiFetch<DownloadUrl>(`/files/${fileId}/download-url`);
}

export function renameFile(fileId: string, name: string): Promise<FileItem> {
  return apiFetch<FileItem>(`/files/${fileId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function moveFile(fileId: string, folderId: string): Promise<FileItem> {
  return apiFetch<FileItem>(`/files/${fileId}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ folderId }),
  });
}

export function deleteFile(fileId: string): Promise<void> {
  return apiFetch<void>(`/files/${fileId}`, { method: 'DELETE' });
}

export function putToStorage(
  ticket: UploadTicket,
  file: File,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed with status ${xhr.status}`));
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection.'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));

    xhr.open('PUT', ticket.uploadUrl);
    xhr.setRequestHeader('Authorization', `Bearer ${ticket.token}`);
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');

    signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}
