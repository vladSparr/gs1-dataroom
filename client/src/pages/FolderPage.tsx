import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FolderPlusIcon, PlusIcon, Share2Icon, UploadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ContentsTable,
  ContentsTableSkeleton,
} from '@/components/ContentsTable';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CreateFolderDialog } from '@/components/CreateFolderDialog';
import { DeleteFileDialog } from '@/components/DeleteFileDialog';
import { DeleteFolderDialog } from '@/components/DeleteFolderDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FilePreviewDialog } from '@/components/FilePreviewDialog';
import { MoveFileDialog } from '@/components/MoveFileDialog';
import { RenameDialog } from '@/components/RenameDialog';
import { ShareDialog } from '@/components/ShareDialog';
import type { ShareTarget } from '@/hooks/useShares';
import { UploadDropzone } from '@/components/UploadDropzone';
import { UploadQueue } from '@/components/UploadQueue';
import {
  useCreateFolder,
  useDeleteFile,
  useDeleteFolder,
  useFolder,
  useFolderChildren,
  useMoveFile,
  useRenameFile,
  useRenameFolder,
} from '@/hooks/useFolder';
import { useUploadQueue } from '@/hooks/useUploadQueue';
import { getDownloadUrl } from '@/api/files';
import type { FileItem, Folder } from '@/api/types';

export function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const filePicker = useRef<HTMLInputElement>(null);

  const folder = useFolder(folderId);
  const children = useFolderChildren(folderId);
  const uploads = useUploadQueue(folderId);

  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();
  const renameFile = useRenameFile();
  const moveFile = useMoveFile();
  const deleteFile = useDeleteFile();

  const [creating, setCreating] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);
  const [movingFile, setMovingFile] = useState<FileItem | null>(null);
  const [deletingFile, setDeletingFile] = useState<FileItem | null>(null);
  const [previewing, setPreviewing] = useState<FileItem | null>(null);
  const [sharing, setSharing] = useState<ShareTarget | null>(null);

  const handleCreateFolder = (name: string) => {
    if (!folderId) return;

    createFolder.mutate(
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

  const handleRenameFolder = (name: string) => {
    if (!renamingFolder) return;

    renameFolder.mutate(
      { id: renamingFolder.id, name },
      {
        onSuccess: () => {
          setRenamingFolder(null);
          toast.success('Folder renamed');
        },
        onError: (error) => toast.error(messageOf(error, 'Could not rename the folder')),
      },
    );
  };

  const handleDeleteFolder = () => {
    if (!deletingFolder) return;

    deleteFolder.mutate(deletingFolder.id, {
      onSuccess: () => {
        toast.success(`“${deletingFolder.name}” deleted`);
        setDeletingFolder(null);
      },
      onError: (error) => toast.error(messageOf(error, 'Could not delete the folder')),
    });
  };

  const handleRenameFile = (name: string) => {
    if (!renamingFile) return;

    renameFile.mutate(
      { id: renamingFile.id, name },
      {
        onSuccess: () => {
          setRenamingFile(null);
          toast.success('File renamed');
        },
        onError: (error) => toast.error(messageOf(error, 'Could not rename the file')),
      },
    );
  };

  const handleMoveFile = (destinationId: string) => {
    if (!movingFile) return;

    moveFile.mutate(
      { id: movingFile.id, folderId: destinationId },
      {
        onSuccess: (moved) => {
          setMovingFile(null);
          toast.success(
            moved.name === movingFile.name
              ? 'File moved'
              : `Moved and renamed to “${moved.name}” — that name was taken`,
          );
        },
        onError: (error) => toast.error(messageOf(error, 'Could not move the file')),
      },
    );
  };

  const handleDeleteFile = () => {
    if (!deletingFile) return;

    deleteFile.mutate(deletingFile.id, {
      onSuccess: () => {
        toast.success(`“${deletingFile.name}” deleted`);
        setDeletingFile(null);
      },
      onError: (error) => toast.error(messageOf(error, 'Could not delete the file')),
    });
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const link = await getDownloadUrl(file.id);
      window.open(link.url, '_blank', 'noopener');
    } catch (error) {
      toast.error(messageOf(error, 'Could not prepare the download'));
    }
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

  const isEmpty =
    children.isSuccess &&
    children.data.folders.length === 0 &&
    children.data.files.length === 0;

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

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            disabled={!folder.isSuccess}
            onClick={() =>
              folder.data &&
              setSharing({
                type: 'FOLDER',
                id: folder.data.id,
                name: folder.data.name,
              })
            }
          >
            <Share2Icon />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={() => setCreating(true)}
            disabled={!folder.isSuccess}
          >
            <PlusIcon />
            New folder
          </Button>
          <Button
            onClick={() => filePicker.current?.click()}
            disabled={!folder.isSuccess}
          >
            <UploadIcon />
            Upload
          </Button>
        </div>
      </div>

      {/* Dragging is not the only way in: the button opens this. */}
      <input
        ref={filePicker}
        type="file"
        multiple
        accept="application/pdf"
        className="hidden"
        onChange={(event) => {
          uploads.enqueue(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />

      <UploadDropzone disabled={!folder.isSuccess} onFiles={uploads.enqueue}>
        <div className="mt-8">
          {children.isPending && <ContentsTableSkeleton />}

          {children.isError && (
            <ErrorState
              title="Could not load this folder's contents"
              error={children.error}
              onRetry={() => void children.refetch()}
              retrying={children.isFetching}
            />
          )}

          {isEmpty && (
            <EmptyState
              icon={FolderPlusIcon}
              title="This folder is empty"
              description="Drag PDFs here to upload them, or create a folder to organise them first."
              action={
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCreating(true)}>
                    <PlusIcon />
                    New folder
                  </Button>
                  <Button onClick={() => filePicker.current?.click()}>
                    <UploadIcon />
                    Upload PDFs
                  </Button>
                </div>
              }
            />
          )}

          {children.isSuccess && !isEmpty && (
            <ContentsTable
              folders={children.data.folders}
              files={children.data.files}
              onOpenFolder={(id) => navigate(`/folders/${id}`)}
              onPreviewFile={setPreviewing}
              onDownloadFile={(file) => void handleDownload(file)}
              folderActions={(child) => ({
                onRename: () => setRenamingFolder(child),
                onDelete: () => setDeletingFolder(child),
                onShare: () =>
                  setSharing({
                    type: 'FOLDER',
                    id: child.id,
                    name: child.name,
                  }),
              })}
              fileActions={(file) => ({
                onRename: () => setRenamingFile(file),
                onMove: () => setMovingFile(file),
                onDelete: () => setDeletingFile(file),
                onShare: () =>
                  setSharing({ type: 'FILE', id: file.id, name: file.name }),
              })}
            />
          )}
        </div>
      </UploadDropzone>

      <CreateFolderDialog
        open={creating}
        onOpenChange={setCreating}
        parentName={folder.data?.name ?? ''}
        pending={createFolder.isPending}
        onSubmit={handleCreateFolder}
      />

      <RenameDialog
        open={renamingFolder !== null}
        onOpenChange={(open) => !open && setRenamingFolder(null)}
        entity="Folder"
        currentName={renamingFolder?.name ?? ''}
        pending={renameFolder.isPending}
        onSubmit={handleRenameFolder}
      />

      <RenameDialog
        open={renamingFile !== null}
        onOpenChange={(open) => !open && setRenamingFile(null)}
        entity="File"
        currentName={renamingFile?.name ?? ''}
        pending={renameFile.isPending}
        onSubmit={handleRenameFile}
      />

      {deletingFolder && (
        <DeleteFolderDialog
          open
          onOpenChange={(open) => !open && setDeletingFolder(null)}
          folderId={deletingFolder.id}
          folderName={deletingFolder.name}
          pending={deleteFolder.isPending}
          onConfirm={handleDeleteFolder}
        />
      )}

      {deletingFile && (
        <DeleteFileDialog
          file={deletingFile}
          pending={deleteFile.isPending}
          onOpenChange={(open) => !open && setDeletingFile(null)}
          onConfirm={handleDeleteFile}
        />
      )}

      {movingFile && (
        <MoveFileDialog
          file={movingFile}
          pending={moveFile.isPending}
          onOpenChange={(open) => !open && setMovingFile(null)}
          onSubmit={handleMoveFile}
        />
      )}

      {previewing && (
        <FilePreviewDialog
          file={previewing}
          onOpenChange={(open) => !open && setPreviewing(null)}
        />
      )}

      {sharing && (
        <ShareDialog
          target={sharing}
          onOpenChange={(open) => !open && setSharing(null)}
        />
      )}

      <UploadQueue
        items={uploads.items}
        onRetry={uploads.retry}
        onDismiss={uploads.dismiss}
      />
    </div>
  );
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
