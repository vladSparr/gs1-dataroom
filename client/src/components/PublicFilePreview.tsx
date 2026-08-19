import { useQuery } from '@tanstack/react-query';
import { DownloadIcon, Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getPublicDownloadUrl } from '@/api/shares';
import type { FileItem } from '@/api/types';

interface PublicFilePreviewProps {
  token: string;
  file: FileItem;
  onOpenChange: (open: boolean) => void;
}

/** The recipient's preview: same layout as the owner's, different endpoint. */
export function PublicFilePreview({
  token,
  file,
  onOpenChange,
}: PublicFilePreviewProps) {
  const link = useQuery({
    queryKey: ['public', token, 'file', file.id, 'download-url'],
    queryFn: () => getPublicDownloadUrl(token, file.id),
    staleTime: 0,
    gcTime: 0,
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-w-5xl flex-col gap-0 p-0 sm:max-w-5xl">
        <DialogHeader className="flex-row items-center justify-between gap-4 border-b px-5 py-3">
          <DialogTitle className="truncate text-sm">{file.name}</DialogTitle>
          <Button
            variant="outline"
            size="sm"
            className="mr-6 shrink-0"
            disabled={!link.isSuccess}
            onClick={() =>
              link.data && window.open(link.data.url, '_blank', 'noopener')
            }
          >
            <DownloadIcon />
            Download
          </Button>
        </DialogHeader>

        <div className="min-h-0 flex-1 bg-muted">
          {link.isPending && (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Preparing preview…
            </div>
          )}

          {link.isError && (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-muted-foreground">
                {link.error instanceof Error
                  ? link.error.message
                  : 'Could not prepare the preview.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void link.refetch()}
              >
                Try again
              </Button>
            </div>
          )}

          {link.isSuccess && (
            <iframe
              src={link.data.url}
              title={file.name}
              className="size-full border-0"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
