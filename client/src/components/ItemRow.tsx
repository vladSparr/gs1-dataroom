import { FolderIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';

interface ItemRowProps {
  name: string;
  meta: string;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}

/** One folder in a listing. Files reuse this row in step 04. */
export function ItemRow({
  name,
  meta,
  onOpen,
  onRename,
  onDelete,
}: ItemRowProps) {
  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{name}</span>
        </div>
      </TableCell>

      <TableCell className="text-right text-sm text-muted-foreground">
        {meta}
      </TableCell>

      <TableCell className="w-12">
        {/* Stops the row's navigation from firing when using the menu. */}
        <div onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`}>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onRename}>
                <PencilIcon />
                Rename
              </DropdownMenuItem>
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
