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

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentName: string;
  pending: boolean;
  onSubmit: (name: string) => void;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  parentName,
  pending,
  onSubmit,
}: CreateFolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Content unmounts on close, so the field starts empty every time. */}
      <DialogContent className="sm:max-w-md">
        <CreateFolderForm
          parentName={parentName}
          pending={pending}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function CreateFolderForm({
  parentName,
  pending,
  onSubmit,
  onCancel,
}: {
  parentName: string;
  pending: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !pending;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit(trimmed);
      }}
    >
      <DialogHeader>
        <DialogTitle>New folder</DialogTitle>
        <DialogDescription>
          It will be created inside “{parentName}”. A name already in use gets a
          number appended.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 grid gap-2">
        <Label htmlFor="folder-name">Name</Label>
        <Input
          id="folder-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Financials"
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
          {pending ? 'Creating…' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );
}
