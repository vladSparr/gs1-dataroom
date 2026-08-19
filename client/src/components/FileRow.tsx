import {
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  FolderInputIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Share2Icon,
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

export interface FileActions {
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  onShare: () => void;
}

interface FileRowProps {
  file: FileItem;
  onPreview: () => void;
  onDownload: () => void;
  /** Omitted in read-only views: Preview and Download remain, nothing else. */
  actions?: FileActions;
}

export function FileRow({
  file,
  onPreview,
  onDownload,
  actions,
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

              {actions && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={actions.onShare}>
                    <Share2Icon />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={actions.onRename}>
                    <PencilIcon />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={actions.onMove}>
                    <FolderInputIcon />
                    Move
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={actions.onDelete}
                  >
                    <Trash2Icon />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
