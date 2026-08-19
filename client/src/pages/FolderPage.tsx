import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FolderPlusIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CreateFolderDialog } from '@/components/CreateFolderDialog';
import { DeleteFolderDialog } from '@/components/DeleteFolderDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ItemRow } from '@/components/ItemRow';
import { RenameDialog } from '@/components/RenameDialog';
import {
  useCreateFolder,
  useDeleteFolder,
  useFolder,
  useRenameFolder,
  useSubfolders,
} from '@/hooks/useFolder';
import { formatDate } from '@/lib/format';
import type { Folder } from '@/api/types';

export function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();

  const folder = useFolder(folderId);
  const children = useSubfolders(folderId);

  const create = useCreateFolder();
  const rename = useRenameFolder();
  const remove = useDeleteFolder();

  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<Folder | null>(null);
  const [deleting, setDeleting] = useState<Folder | null>(null);

  const handleCreate = (name: string) => {
    if (!folderId) return;

    create.mutate(
      { parentId: folderId, name },
      {
        onSuccess: (created) => {
          setCreating(false);
          toast.success(
            created.name === name
              ? `“${created.name}” created`
              : `Name taken, created “${created.name}” instead`,
          );
        },
        onError: (error) => toast.error(messageOf(error, 'Could not create the folder')),
      },
    );
  };

  const handleRename = (name: string) => {
    if (!renaming) return;

    rename.mutate(
      { id: renaming.id, name },
      {
        onSuccess: () => {
          setRenaming(null);
          toast.success('Folder renamed');
        },
        onError: (error) => toast.error(messageOf(error, 'Could not rename the folder')),
      },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;

    remove.mutate(deleting.id, {
      onSuccess: (result) => {
        toast.success(summariseDeletion(deleting.name, result.deleted.folderCount));
        setDeleting(null);
      },
      onError: (error) => toast.error(messageOf(error, 'Could not delete the folder')),
    });
  };

  if (folder.isError) {
    return (
      <ErrorState
        title="Could not open this folder"
        error={folder.error}
        onRetry={() => void folder.refetch()}
        retrying={folder.isFetching}
      />
    );
  }

  return (
    <div>
      {folder.isPending ? (
        <Skeleton className="h-5 w-72" />
      ) : (
        <Breadcrumbs crumbs={folder.data.breadcrumbs} />
      )}

      <div className="mt-6 flex items-center justify-between gap-4">
        {folder.isPending ? (
          <Skeleton className="h-8 w-56" />
        ) : (
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {folder.data.name}
          </h1>
        )}

        <Button onClick={() => setCreating(true)} disabled={!folder.isSuccess}>
          <PlusIcon />
          New folder
        </Button>
      </div>

      <div className="mt-8">
        {children.isPending && <TableSkeleton />}

        {children.isError && (
          <ErrorState
            title="Could not load this folder's contents"
            error={children.error}
            onRetry={() => void children.refetch()}
            retrying={children.isFetching}
          />
        )}

        {children.isSuccess && children.data.items.length === 0 && (
          <EmptyState
            icon={FolderPlusIcon}
            title="This folder is empty"
            description="Create a folder to start organising this data room."
            action={
              <Button onClick={() => setCreating(true)}>
                <PlusIcon />
                New folder
              </Button>
            }
          />
        )}

        {children.isSuccess && children.data.items.length > 0 && (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {children.data.items.map((child) => (
                  <ItemRow
                    key={child.id}
                    name={child.name}
                    meta={formatDate(child.updatedAt)}
                    onOpen={() => navigate(`/folders/${child.id}`)}
                    onRename={() => setRenaming(child)}
                    onDelete={() => setDeleting(child)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CreateFolderDialog
        open={creating}
        onOpenChange={setCreating}
        parentName={folder.data?.name ?? ''}
        pending={create.isPending}
        onSubmit={handleCreate}
      />

      <RenameDialog
        open={renaming !== null}
        onOpenChange={(open) => !open && setRenaming(null)}
        entity="Folder"
        currentName={renaming?.name ?? ''}
        pending={rename.isPending}
        onSubmit={handleRename}
      />

      {deleting && (
        <DeleteFolderDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          folderId={deleting.id}
          folderName={deleting.name}
          pending={remove.isPending}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Updated</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {[0, 1, 2, 3].map((key) => (
            <TableRow key={key}>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-24" />
              </TableCell>
              <TableCell />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function summariseDeletion(name: string, nestedFolders: number): string {
  return nestedFolders === 0
    ? `“${name}” deleted`
    : `“${name}” and ${nestedFolders} nested folders deleted`;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
