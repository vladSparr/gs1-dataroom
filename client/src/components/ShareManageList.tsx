import { useState } from 'react';
import { GlobeIcon, Loader2Icon, UsersIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import type { Share } from '@/api/types';

interface ShareManageListProps {
  shares: Share[];
  loading: boolean;
  revoking: boolean;
  onRevoke: (shareId: string) => void;
}

export function ShareManageList({
  shares,
  loading,
  revoking,
  onRevoke,
}: ShareManageListProps) {
  const [confirming, setConfirming] = useState<Share | null>(null);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Loading active shares…
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        This item is not shared with anyone yet.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y">
        {shares.map((share) => (
          <li key={share.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {share.mode === 'PUBLIC_LINK' ? (
                  <GlobeIcon className="size-3.5 text-muted-foreground" />
                ) : (
                  <UsersIcon className="size-3.5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {share.mode === 'PUBLIC_LINK'
                    ? 'Anyone with the link'
                    : `${share.grantedTo.length} invited`}
                </span>
                <Badge variant="secondary">Viewer</Badge>
              </div>

              {share.mode === 'RESTRICTED' && share.grantedTo.length > 0 && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {share.grantedTo.join(', ')}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Created {formatDate(share.createdAt)}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              disabled={revoking}
              onClick={() => setConfirming(share)}
            >
              Revoke
            </Button>
          </li>
        ))}
      </ul>

      <AlertDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this share?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirming?.mode === 'PUBLIC_LINK'
                ? 'Anyone using this link will lose access immediately, including people already viewing it.'
                : `The ${confirming?.grantedTo.length ?? 0} invited people will lose access immediately, including anyone already viewing it.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={revoking}
              onClick={(event) => {
                event.preventDefault();
                if (confirming) onRevoke(confirming.id);
                setConfirming(null);
              }}
            >
              {revoking ? 'Revoking…' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
