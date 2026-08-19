import { useNavigate } from 'react-router-dom';
import { FileTextIcon, FolderIcon, FolderLockIcon, InboxIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useSharedWithMe } from '@/hooks/useShares';
import { formatDate } from '@/lib/format';
import type { ShareTargetType } from '@/api/types';

export function SharedWithMePage() {
  const navigate = useNavigate();
  const shared = useSharedWithMe();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Shared with me</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Items other people gave you read-only access to.
      </p>

      <div className="mt-8">
        {shared.isPending && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <Card key={key} className="p-5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-3 h-4 w-28" />
              </Card>
            ))}
          </div>
        )}

        {shared.isError && (
          <ErrorState
            title="Could not load what was shared with you"
            error={shared.error}
            onRetry={() => void shared.refetch()}
            retrying={shared.isFetching}
          />
        )}

        {shared.isSuccess && shared.data.length === 0 && (
          <EmptyState
            icon={InboxIcon}
            title="Nothing shared with you yet"
            description="When someone shares a data room, folder or file with this account, it appears here."
          />
        )}

        {shared.isSuccess && shared.data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shared.data.map((item) => (
              <Card
                key={item.shareId}
                className="cursor-pointer p-5 transition-colors hover:bg-muted/50"
                onClick={() => navigate(`/s/${item.token}`)}
              >
                <div className="flex items-start gap-2.5">
                  <TargetIcon type={item.targetType} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {item.targetType === 'DATA_ROOM'
                        ? 'Data room'
                        : `in ${item.roomName}`}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.ownerName ? `${item.ownerName} · ` : ''}
                      {formatDate(item.sharedAt)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TargetIcon({ type }: { type: ShareTargetType }) {
  const className = 'mt-0.5 size-4 shrink-0 text-muted-foreground';

  if (type === 'DATA_ROOM') return <FolderLockIcon className={className} />;
  if (type === 'FOLDER') return <FolderIcon className={className} />;
  return <FileTextIcon className={className} />;
}
