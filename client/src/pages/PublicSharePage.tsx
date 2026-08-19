import { useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EyeIcon, LinkIcon, LockIcon, UserXIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { PublicFilePreview } from '@/components/PublicFilePreview';
import { ReadOnlyFolderView } from '@/components/ReadOnlyFolderView';
import { useAuth } from '@/auth/useAuth';
import {
  getPublicDownloadUrl,
  getPublicShare,
  listPublicFolder,
} from '@/api/shares';
import { ApiError } from '@/lib/api';
import { rememberReturnPath } from '@/auth/returnPath';
import type { FileItem } from '@/api/types';

export function PublicSharePage() {
  const { token = '', folderId } = useParams<{
    token: string;
    folderId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signInWithGoogle } = useAuth();
  const [previewing, setPreviewing] = useState<FileItem | null>(null);

  const share = useQuery({
    queryKey: ['public', token],
    queryFn: () => getPublicShare(token),
    retry: false,
  });

  const currentFolder = folderId ?? share.data?.rootFolderId ?? null;

  const view = useQuery({
    queryKey: ['public', token, 'folder', currentFolder],
    queryFn: () => listPublicFolder(token, currentFolder ?? ''),
    enabled: share.isSuccess && currentFolder !== null,
    retry: false,
  });

  const download = async (file: FileItem) => {
    try {
      const link = await getPublicDownloadUrl(token, file.id);
      window.open(link.url, '_blank', 'noopener');
    } catch {
      toast.error('Could not prepare the download.');
    }
  };

  const blocker = statusOf(share.error) ?? statusOf(view.error);
  const sharedFile = share.data?.file ?? null;

  if (blocker === 401) {
    return (
      <Gate
        icon={LockIcon}
        title="This item was shared with specific people"
        description="Sign in with the account it was shared with to open it."
        action={
          <Button
            onClick={() => {
              rememberReturnPath(location.pathname);
              void signInWithGoogle();
            }}
          >
            Continue with Google
          </Button>
        }
      />
    );
  }

  if (blocker === 403) {
    return (
      <Gate
        icon={UserXIcon}
        title="This account does not have access"
        description={
          user?.email
            ? `You are signed in as ${user.email}. Ask the owner to share it with this address, or switch to the account it was sent to.`
            : 'Ask the owner to share it with your account.'
        }
      />
    );
  }

  if (blocker !== null) {
    return (
      <Gate
        icon={LinkIcon}
        title="This link is no longer active"
        description="It may have been revoked by its owner, or the item was deleted."
      />
    );
  }

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center justify-between gap-4 border-b px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-sm font-semibold tracking-tight">
            {share.data?.name ?? 'Shared item'}
          </span>
          <Badge variant="secondary" className="shrink-0 gap-1">
            <EyeIcon className="size-3" />
            Read-only
          </Badge>
        </div>

        {share.data?.ownerName && (
          <span className="shrink-0 truncate text-sm text-muted-foreground">
            Shared by {share.data.ownerName}
          </span>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        {sharedFile ? (
          <SingleFile
            file={sharedFile}
            onPreview={() => setPreviewing(sharedFile)}
            onDownload={() => void download(sharedFile)}
          />
        ) : (
          <ReadOnlyFolderView
            view={view.data}
            loading={share.isPending || view.isPending}
            onOpenFolder={(id) => navigate(`/s/${token}/f/${id}`)}
            onPreviewFile={setPreviewing}
            onDownloadFile={(file) => void download(file)}
          />
        )}
      </main>

      {previewing && (
        <PublicFilePreview
          token={token}
          file={previewing}
          onOpenChange={(open) => !open && setPreviewing(null)}
        />
      )}

      <Toaster />
    </div>
  );
}

function SingleFile({
  file,
  onPreview,
  onDownload,
}: {
  file: FileItem;
  onPreview: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="rounded-xl border p-8 text-center">
      <h1 className="truncate text-lg font-medium">{file.name}</h1>
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={onPreview}>Open</Button>
        <Button variant="outline" onClick={onDownload}>
          Download
        </Button>
      </div>
    </div>
  );
}

function Gate({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof LockIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center text-card-foreground">
        <Icon
          className="mx-auto size-7 text-muted-foreground"
          strokeWidth={1.5}
        />
        <h1 className="mt-4 text-base font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}

function statusOf(error: unknown): number | null {
  return error instanceof ApiError ? error.status : null;
}
