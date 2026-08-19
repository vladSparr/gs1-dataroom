import {
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  FolderInputIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatBytes, formatDate } from '@/lib/format';
import type { FileItem } from '@/api/types';

interface FileRowProps {
  file: FileItem;
  onPreview: () => void;
  onDownload: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
}

export function FileRow({
  file,
  onPreview,
  onDownload,
  onRename,
  onMove,
  onDelete,
}: FileRowProps) {
  return (
    <TableRow className="cursor-pointer" onClick={onPreview}>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{file.name}</span>
        </div>
      </TableCell>

      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
        {formatBytes(file.size)}
      </TableCell>

      <TableCell className="text-right text-sm text-muted-foreground">
        {formatDate(file.updatedAt)}
      </TableCell>

      <TableCell className="w-12">
        <div onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${file.name}`}
              >
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onPreview}>
                <EyeIcon />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDownload}>
                <DownloadIcon />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onRename}>
                <PencilIcon />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onMove}>
                <FolderInputIcon />
                Move
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
