import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { completeUpload, createUploadTicket, putToStorage } from '@/api/files';

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  /** 0..1 */
  progress: number;
  status: UploadStatus;
  error?: string;
  /** Resolved by the server; may differ from file.name. */
  storedName?: string;
}

/**
 * Unlimited parallel uploads on a slow connection produce stalled bars and
 * browser connection-limit queuing that reads as a freeze.
 */
const MAX_CONCURRENT = 3;

/** How long the panel lingers after the last item settles. */
const PANEL_LINGER_MS = 4000;

export function useUploadQueue(folderId: string | undefined) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<UploadItem[]>([]);

  const pending = useRef<UploadItem[]>([]);
  const workers = useRef(0);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Retry needs the current items without capturing them in its own deps,
  // and enqueueing from inside a state updater would double up under
  // StrictMode, which invokes updaters twice.
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
        // Failures stay on screen: they still need a decision from the user.
        current.some((item) => item.status === 'error') ? current : [],
      );
    }, PANEL_LINGER_MS);
  }, []);

  /** The four-step sequence for one file. Never throws. */
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

        // Show the name the server settled on, not the one we sent.
        patch(item.id, { status: 'done', progress: 1, storedName: ticket.name });
        await queryClient.invalidateQueries({
          queryKey: ['folder', targetFolderId, 'children'],
        });
      } catch (error) {
        // One failure must not abort the rest of the batch.
        patch(item.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    },
    [patch, queryClient],
  );

  /** Pulls from the queue until it is empty, then retires. */
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
