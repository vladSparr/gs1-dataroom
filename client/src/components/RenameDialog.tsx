import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "Data room" or "Folder" — used in the title. */
  entity: string;
  currentName: string;
  pending: boolean;
  onSubmit: (name: string) => void;
}

export function RenameDialog({
  open,
  onOpenChange,
  entity,
  currentName,
  pending,
  onSubmit,
}: RenameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Radix unmounts the content on close, so the form's state resets on
          each open without an effect. */}
      <DialogContent className="sm:max-w-md">
        <RenameForm
          entity={entity}
          currentName={currentName}
          pending={pending}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function RenameForm({
  entity,
  currentName,
  pending,
  onSubmit,
  onCancel,
}: Omit<RenameDialogProps, 'open' | 'onOpenChange'> & {
  onCancel: () => void;
}) {
  const [name, setName] = useState(currentName);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && trimmed !== currentName && !pending;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit(trimmed);
      }}
    >
      <DialogHeader>
        <DialogTitle>Rename {entity.toLowerCase()}</DialogTitle>
        <DialogDescription>
          Choose a new name for “{currentName}”.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 grid gap-2">
        <Label htmlFor="rename-name">Name</Label>
        <Input
          id="rename-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          autoFocus
        />
      </div>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
}
