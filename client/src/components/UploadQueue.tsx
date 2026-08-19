import { useState } from 'react';
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2Icon,
  OctagonXIcon,
  XIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { UploadItem } from '@/hooks/useUploadQueue';

interface UploadQueueProps {
  items: UploadItem[];
  onRetry: (id: string) => void;
  onDismiss: () => void;
}

/**
 * Fixed panel, deliberately not a modal: browsing must stay possible while
 * files are going up.
 */
export function UploadQueue({ items, onRetry, onDismiss }: UploadQueueProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (items.length === 0) return null;

  const settled = items.filter((item) => item.status !== 'queued' && item.status !== 'uploading');
  const failed = items.filter((item) => item.status === 'error');
  const active = items.length - settled.length;

  return (
    <div className="fixed right-6 bottom-6 z-50 w-80 overflow-hidden rounded-xl border bg-card shadow-lg">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <p className="truncate text-sm font-medium">{heading(items.length, settled.length, failed.length, active)}</p>

        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={collapsed ? 'Expand uploads' : 'Collapse uploads'}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss uploads"
            onClick={onDismiss}
          >
            <XIcon />
          </Button>
        </div>
      </div>

      {!collapsed && (
        <ul className="max-h-72 divide-y overflow-y-auto">
          {items.map((item) => (
            <li key={item.id} className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <StatusIcon status={item.status} />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {item.storedName ?? item.file.name}
                </span>
                {item.status === 'uploading' && (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {Math.round(item.progress * 100)}%
                  </span>
                )}
                {item.status === 'error' && (
                  <Button variant="ghost" size="xs" onClick={() => onRetry(item.id)}>
                    Retry
                  </Button>
                )}
              </div>

              {item.status === 'uploading' && (
                <Progress className="mt-2" value={item.progress * 100} />
              )}
              {item.status === 'error' && item.error && (
                <p className="mt-1 text-xs text-destructive">{item.error}</p>
              )}
              {item.storedName && item.storedName !== item.file.name && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Renamed from {item.file.name} — that name was taken.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: UploadItem['status'] }) {
  if (status === 'done') {
    return <CheckCircle2Icon className="size-4 shrink-0 text-muted-foreground" />;
  }
  if (status === 'error') {
    return <OctagonXIcon className="size-4 shrink-0 text-destructive" />;
  }
  if (status === 'uploading') {
    return <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />;
  }
  return <Loader2Icon className="size-4 shrink-0 text-muted-foreground/40" />;
}

function heading(total: number, settled: number, failed: number, active: number): string {
  if (active > 0) return `Uploading ${Math.min(settled + 1, total)} of ${total}`;
  if (failed > 0) return `${failed} of ${total} failed`;
  return total === 1 ? 'Upload complete' : `${total} uploads complete`;
}
