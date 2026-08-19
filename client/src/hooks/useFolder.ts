import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFolder,
  deleteFolder,
  getFolder,
  getFolderStats,
  listChildren,
  renameFolder,
} from '@/api/folders';
import { deleteFile, moveFile, renameFile } from '@/api/files';

export function useFolder(folderId: string | undefined) {
  return useQuery({
    queryKey: ['folder', folderId],
    queryFn: () => getFolder(folderId as string),
    enabled: Boolean(folderId),
  });
}

/** Subfolders and READY files for one folder, in a single request. */
export function useFolderChildren(folderId: string | undefined) {
  return useQuery({
    queryKey: ['folder', folderId, 'children'],
    queryFn: () => listChildren(folderId as string),
    enabled: Boolean(folderId),
  });
}

/** Only enabled once the delete dialog opens — stats are not needed on load. */
export function useFolderStats(folderId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['folder', folderId, 'stats'],
    queryFn: () => getFolderStats(folderId as string),
    enabled: enabled && Boolean(folderId),
  });
}

/**
 * Any folder mutation shifts counts for every ancestor, so the whole `folder`
 * key is invalidated. Reconciling individual keys would be more code for no
 * user-visible gain at this scale.
 */
function useFolderMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folder'] }),
  });
}

export function useCreateFolder() {
  return useFolderMutation(({ parentId, name }: { parentId: string; name: string }) =>
    createFolder(parentId, name),
  );
}

export function useRenameFolder() {
  return useFolderMutation(({ id, name }: { id: string; name: string }) =>
    renameFolder(id, name),
  );
}

export function useDeleteFolder() {
  return useFolderMutation((id: string) => deleteFolder(id));
}

// File mutations share the same invalidation: a move touches two folders, and
// a rename changes the sort order of the listing it lives in.

export function useRenameFile() {
  return useFolderMutation(({ id, name }: { id: string; name: string }) =>
    renameFile(id, name),
  );
}

export function useMoveFile() {
  return useFolderMutation(({ id, folderId }: { id: string; folderId: string }) =>
    moveFile(id, folderId),
  );
}

export function useDeleteFile() {
  return useFolderMutation((id: string) => deleteFile(id));
}
