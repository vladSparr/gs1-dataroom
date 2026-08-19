import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FolderLockIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateRoomDialog } from '@/components/CreateRoomDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { RenameDialog } from '@/components/RenameDialog';
import {
  useCreateRoom,
  useDeleteRoom,
  useRenameRoom,
  useRooms,
} from '@/hooks/useRooms';
import { formatDate } from '@/lib/format';
import type { Room } from '@/api/types';

export function RoomsPage() {
  const navigate = useNavigate();
  const rooms = useRooms();

  const create = useCreateRoom();
  const rename = useRenameRoom();
  const remove = useDeleteRoom();

  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);

  const handleCreate = (name: string) => {
    create.mutate(name, {
      onSuccess: (room) => {
        setCreating(false);
        toast.success(`“${room.name}” created`);
        navigate(`/folders/${room.rootFolderId}`);
      },
      onError: (error) => toast.error(messageOf(error, 'Could not create the data room')),
    });
  };

  const handleRename = (name: string) => {
    if (!renaming) return;

    rename.mutate(
      { id: renaming.id, name },
      {
        onSuccess: () => {
          setRenaming(null);
          toast.success('Data room renamed');
        },
        onError: (error) => toast.error(messageOf(error, 'Could not rename the data room')),
      },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;

    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`“${deleting.name}” deleted`);
        setDeleting(null);
      },
      onError: (error) => toast.error(messageOf(error, 'Could not delete the data room')),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Data rooms</h1>
        {rooms.isSuccess && rooms.data.items.length > 0 && (
          <Button onClick={() => setCreating(true)}>
            <PlusIcon />
            New data room
          </Button>
        )}
      </div>

      <div className="mt-8">
        {rooms.isPending && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <Card key={key} className="p-5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-3 h-4 w-24" />
              </Card>
            ))}
          </div>
        )}

        {rooms.isError && (
          <ErrorState
            title="Could not load your data rooms"
            error={rooms.error}
            onRetry={() => void rooms.refetch()}
            retrying={rooms.isFetching}
          />
        )}

        {rooms.isSuccess && rooms.data.items.length === 0 && (
          <EmptyState
            icon={FolderLockIcon}
            title="No data rooms yet"
            description="A data room is a secure, top-level container for the documents you want to store and share."
            action={
              <Button onClick={() => setCreating(true)}>
                <PlusIcon />
                New data room
              </Button>
            }
          />
        )}

        {rooms.isSuccess && rooms.data.items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.data.items.map((room) => (
              <Card
                key={room.id}
                className="cursor-pointer p-5 transition-colors hover:bg-muted/50"
                onClick={() => navigate(`/folders/${room.rootFolderId}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{room.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Created {formatDate(room.createdAt)}
                    </p>
                  </div>

                  <div onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${room.name}`}
                        >
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setRenaming(room)}>
                          <PencilIcon />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleting(room)}
                        >
                          <Trash2Icon />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateRoomDialog
        open={creating}
        onOpenChange={setCreating}
        pending={create.isPending}
        onSubmit={handleCreate}
      />

      <RenameDialog
        open={renaming !== null}
        onOpenChange={(open) => !open && setRenaming(null)}
        entity="Data room"
        currentName={renaming?.name ?? ''}
        pending={rename.isPending}
        onSubmit={handleRename}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the data room and every folder and file
              inside it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
