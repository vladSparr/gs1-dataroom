import { Loader2Icon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFolderStats } from '@/hooks/useFolder';
import { formatBytes, pluralise } from '@/lib/format';
import type { FolderStats } from '@/api/types';

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
  pending: boolean;
  onConfirm: () => void;
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
  pending,
  onConfirm,
}: DeleteFolderDialogProps) {
  // Fetched when the dialog opens, not on page load.
  const stats = useFolderStats(folderId, open);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{folderName}”?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">
              {stats.isPending && (
                <span className="flex items-center gap-2">
                  <Loader2Icon className="size-4 animate-spin" />
                  Checking what this folder contains…
                </span>
              )}
              {stats.isError && (
                <span className="text-destructive">
                  Could not read the folder contents, so the consequence of
                  deleting is unknown. Close this and try again.
                </span>
              )}
              {stats.isSuccess && <span>{describe(stats.data)}</span>}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            // Never let someone confirm a deletion whose size is still unknown.
            disabled={!stats.isSuccess || pending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function describe(stats: FolderStats): string {
  const { folderCount, fileCount, totalSize } = stats;

  if (folderCount === 0 && fileCount === 0) {
    return 'This folder is empty. This cannot be undone.';
  }

  const parts: string[] = [];
  if (folderCount > 0) parts.push(pluralise(folderCount, 'folder'));
  if (fileCount > 0) {
    parts.push(`${pluralise(fileCount, 'file')} (${formatBytes(totalSize)})`);
  }

  return `This permanently deletes ${parts.join(' and ')}. This cannot be undone.`;
}
