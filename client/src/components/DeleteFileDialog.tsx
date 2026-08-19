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
import { formatBytes } from '@/lib/format';
import type { FileItem } from '@/api/types';

interface DeleteFileDialogProps {
  file: FileItem;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteFileDialog({
  file,
  pending,
  onOpenChange,
  onConfirm,
}: DeleteFileDialogProps) {
  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{file.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {/* The size is already known from the listing, so unlike folder
                deletion there is nothing to fetch first. */}
            This permanently deletes the file ({formatBytes(file.size)}) and
            removes it from storage. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
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
