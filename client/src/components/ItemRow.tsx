import {
  FolderIcon,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';

export interface FolderActions {
  onRename: () => void;
  onDelete: () => void;
  onShare: () => void;
}

interface ItemRowProps {
  name: string;
  meta: string;
  onOpen: () => void;
  actions?: FolderActions;
}

export function ItemRow({ name, meta, onOpen, actions }: ItemRowProps) {
  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{name}</span>
        </div>
      </TableCell>

      <TableCell className="text-right text-sm text-muted-foreground">—</TableCell>

      <TableCell className="text-right text-sm text-muted-foreground">
        {meta}
      </TableCell>

      <TableCell className="w-12">
        {actions && (
          <div onClick={(event) => event.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${name}`}
                >
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={actions.onShare}>
                  <Share2Icon />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={actions.onRename}>
                  <PencilIcon />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={actions.onDelete}
                >
                  <Trash2Icon />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
