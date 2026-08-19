import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { FileRow, type FileActions } from '@/components/FileRow';
import { ItemRow, type FolderActions } from '@/components/ItemRow';
import { formatDate } from '@/lib/format';
import type { FileItem, Folder } from '@/api/types';

interface ContentsTableProps {
  folders: Folder[];
  files: FileItem[];
  onOpenFolder: (folderId: string) => void;
  onPreviewFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
  folderActions?: (folder: Folder) => FolderActions;
  fileActions?: (file: FileItem) => FileActions;
}

export function ContentsTable({
  folders,
  files,
  onOpenFolder,
  onPreviewFile,
  onDownloadFile,
  folderActions,
  fileActions,
}: ContentsTableProps) {
  return (
    <div className="rounded-xl border">
      <Table>
        <ContentsHeader />
        <TableBody>
          {folders.map((folder) => (
            <ItemRow
              key={folder.id}
              name={folder.name}
              meta={formatDate(folder.updatedAt)}
              onOpen={() => onOpenFolder(folder.id)}
              actions={folderActions?.(folder)}
            />
          ))}

          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              onPreview={() => onPreviewFile(file)}
              onDownload={() => onDownloadFile(file)}
              actions={fileActions?.(file)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ContentsTableSkeleton() {
  return (
    <div className="rounded-xl border">
      <Table>
        <ContentsHeader />
        <TableBody>
          {[0, 1, 2, 3].map((key) => (
            <TableRow key={key}>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-14" />
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

function ContentsHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead className="w-28 text-right">Size</TableHead>
        <TableHead className="w-36 text-right">Updated</TableHead>
        <TableHead className="w-12" />
      </TableRow>
    </TableHeader>
  );
}
