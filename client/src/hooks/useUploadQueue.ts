import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { completeUpload, createUploadTicket, putToStorage } from '@/api/files';

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
  storedName?: string;
}

const MAX_CONCURRENT = 3;

const PANEL_LINGER_MS = 4000;

export function useUploadQueue(folderId: string | undefined) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<UploadItem[]>([]);

  const pending = useRef<UploadItem[]>([]);
  const workers = useRef(0);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const latest = useRef<UploadItem[]>([]);
  useEffect(() => {
    latest.current = items;
  }, [items]);

  const patch = useCallback((id: string, changes: Partial<UploadItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }, []);

  const scheduleClear = useCallback(() => {
    if (clearTimer.current) clearTimeout(clearTimer.current);

    clearTimer.current = setTimeout(() => {
      setItems((current) =>
        current.some((item) => item.status === 'error') ? current : [],
      );
    }, PANEL_LINGER_MS);
  }, []);

  const uploadOne = useCallback(
    async (item: UploadItem, targetFolderId: string) => {
      patch(item.id, { status: 'uploading', progress: 0, error: undefined });

      try {
        const ticket = await createUploadTicket({
          folderId: targetFolderId,
          name: item.file.name,
          size: item.file.size,
          mimeType: item.file.type || 'application/pdf',
        });

        await putToStorage(ticket, item.file, (fraction) =>
          patch(item.id, { progress: fraction }),
        );
        await completeUpload(ticket.fileId, item.file.size);

        patch(item.id, { status: 'done', progress: 1, storedName: ticket.name });
        await queryClient.invalidateQueries({
          queryKey: ['folder', targetFolderId, 'children'],
        });
      } catch (error) {
        patch(item.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    },
    [patch, queryClient],
  );

  const worker = useCallback(
    async (targetFolderId: string) => {
      workers.current += 1;
      try {
        for (;;) {
          const next = pending.current.shift();
          if (!next) break;
          await uploadOne(next, targetFolderId);
        }
      } finally {
        workers.current -= 1;
        if (workers.current === 0) scheduleClear();
      }
    },
    [uploadOne, scheduleClear],
  );

  const start = useCallback(
    (targetFolderId: string) => {
      if (clearTimer.current) clearTimeout(clearTimer.current);

      const spare = MAX_CONCURRENT - workers.current;
      for (let slot = 0; slot < spare; slot += 1) {
        void worker(targetFolderId);
      }
    },
    [worker],
  );

  const enqueue = useCallback(
    (files: File[]) => {
      if (!folderId || files.length === 0) return;

      const queued: UploadItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: 'queued',
      }));

      setItems((current) => [...current, ...queued]);
      pending.current.push(...queued);
      start(folderId);
    },
    [folderId, start],
  );

  const retry = useCallback(
    (id: string) => {
      if (!folderId) return;

      const item = latest.current.find((candidate) => candidate.id === id);
      if (!item) return;

      patch(id, { status: 'queued', progress: 0, error: undefined });
      pending.current.push({ ...item, status: 'queued', progress: 0 });
      start(folderId);
    },
    [folderId, patch, start],
  );

  const dismiss = useCallback(() => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    setItems([]);
  }, []);

  return { items, enqueue, retry, dismiss };
}
