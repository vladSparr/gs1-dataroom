import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { listRoomFolders } from '@/api/rooms';
import type { FileItem } from '@/api/types';

interface MoveFileDialogProps {
  file: FileItem;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (folderId: string) => void;
}

/**
 * A flat list indented by depth rather than an expandable tree: the server
 * already returns the room's folders ordered by path, so this reads correctly
 * with no client-side assembly.
 */
export function MoveFileDialog({
  file,
  pending,
  onOpenChange,
  onSubmit,
}: MoveFileDialogProps) {
  const [destination, setDestination] = useState<string>('');

  const folders = useQuery({
    queryKey: ['room', file.dataRoomId, 'folders'],
    queryFn: () => listRoomFolders(file.dataRoomId),
  });

  const canSubmit = destination !== '' && destination !== file.folderId && !pending;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move file</DialogTitle>
          <DialogDescription>
            Choose a destination folder for “{file.name}”. A name already in use
            there gets a number appended.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid gap-2">
          <Label htmlFor="move-destination">Destination</Label>

          {folders.isPending && (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Loading folders…
            </div>
          )}

          {folders.isError && (
            <div className="py-2">
              <p className="text-sm text-destructive">
                Could not load the folder list.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => void folders.refetch()}
              >
                Try again
              </Button>
            </div>
          )}

          {folders.isSuccess && (
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger id="move-destination" className="w-full">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                {folders.data.map((folder) => (
                  <SelectItem
                    key={folder.id}
                    value={folder.id}
                    disabled={folder.id === file.folderId}
                  >
                    <span style={{ paddingLeft: `${folder.depth * 14}px` }}>
                      {folder.name}
                      {folder.id === file.folderId && ' (current)'}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => onSubmit(destination)}
          >
            {pending ? 'Moving…' : 'Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
