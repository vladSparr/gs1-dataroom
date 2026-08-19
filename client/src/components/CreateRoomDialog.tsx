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

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onSubmit: (name: string) => void;
}

export function CreateRoomDialog({
  open,
  onOpenChange,
  pending,
  onSubmit,
}: CreateRoomDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Content unmounts on close, so the field starts empty every time. */}
      <DialogContent className="sm:max-w-md">
        <CreateRoomForm
          pending={pending}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function CreateRoomForm({
  pending,
  onSubmit,
  onCancel,
}: {
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
        <DialogTitle>New data room</DialogTitle>
        <DialogDescription>
          A data room is a top-level container for your documents.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 grid gap-2">
        <Label htmlFor="room-name">Name</Label>
        <Input
          id="room-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Acme Corp — Series B"
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
