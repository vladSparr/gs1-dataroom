import { useState } from 'react';
import { toast } from 'sonner';
import { CheckIcon, CopyIcon, XIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShareManageList } from '@/components/ShareManageList';
import {
  useCreateShare,
  useRevokeShare,
  useShares,
  type ShareTarget,
} from '@/hooks/useShares';
import { shareLink } from '@/api/shares';
import type { Share } from '@/api/types';

interface ShareDialogProps {
  target: ShareTarget;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ target, onOpenChange }: ShareDialogProps) {
  const shares = useShares(target);
  const create = useCreateShare(target);
  const revoke = useRevokeShare(target);

  const publicShare =
    shares.data?.find((share) => share.mode === 'PUBLIC_LINK') ?? null;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="truncate">Share “{target.name}”</DialogTitle>
          <DialogDescription>
            Recipients get read-only access to this item and everything inside it.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="link" className="flex-1">
              Public link
            </TabsTrigger>
            <TabsTrigger value="people" className="flex-1">
              Specific people
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="mt-4">
            <PublicLinkTab
              share={publicShare}
              creating={create.isPending}
              onCreate={() =>
                create.mutate(
                  { mode: 'PUBLIC_LINK' },
                  {
                    onError: (error) =>
                      toast.error(messageOf(error, 'Could not create the link')),
                  },
                )
              }
            />
          </TabsContent>

          <TabsContent value="people" className="mt-4">
            <InviteTab
              inviting={create.isPending}
              onInvite={(emails) =>
                create.mutate(
                  { mode: 'RESTRICTED', emails },
                  {
                    onSuccess: () =>
                      toast.success(
                        `Invited ${emails.length} ${emails.length === 1 ? 'person' : 'people'}`,
                      ),
                    onError: (error) =>
                      toast.error(messageOf(error, 'Could not send the invite')),
                  },
                )
              }
            />
          </TabsContent>
        </Tabs>

        <Separator className="my-5" />

        <div>
          <h3 className="text-sm font-medium">Active shares</h3>
          <ShareManageList
            shares={shares.data ?? []}
            loading={shares.isPending}
            revoking={revoke.isPending}
            onRevoke={(shareId) =>
              revoke.mutate(shareId, {
                onSuccess: () => toast.success('Access revoked'),
                onError: (error) =>
                  toast.error(messageOf(error, 'Could not revoke access')),
              })
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PublicLinkTab({
  share,
  creating,
  onCreate,
}: {
  share: Share | null;
  creating: boolean;
  onCreate: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!share) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Anyone with the link will be able to view this, without signing in.
        </p>
        <Button className="mt-4" disabled={creating} onClick={onCreate}>
          {creating ? 'Creating…' : 'Create public link'}
        </Button>
      </div>
    );
  }

  const url = shareLink(share.token);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.');
    }
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="share-link">Anyone with this link can view</Label>
      <div className="flex gap-2">
        <Input id="share-link" readOnly value={url} onFocus={(e) => e.target.select()} />
        <Button variant="outline" className="shrink-0" onClick={() => void copy()}>
          {copied ? <CheckIcon /> : <CopyIcon />}
          Copy
        </Button>
      </div>
    </div>
  );
}

function InviteTab({
  inviting,
  onInvite,
}: {
  inviting: boolean;
  onInvite: (emails: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const [emails, setEmails] = useState<string[]>([]);

  const commit = () => {
    // Comma, semicolon, space or Enter all end an address.
    const parts = draft
      .split(/[,;\s]+/)
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.length > 0);

    if (parts.length === 0) return;
    setEmails((current) => [...new Set([...current, ...parts])]);
    setDraft('');
  };

  const invalid = emails.filter((email) => !email.includes('@'));
  const canInvite = emails.length > 0 && invalid.length === 0 && !inviting;

  return (
    <div className="grid gap-2">
      <Label htmlFor="share-emails">Email addresses</Label>

      {emails.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {emails.map((email) => (
            <Badge
              key={email}
              variant={email.includes('@') ? 'secondary' : 'destructive'}
              className="gap-1"
            >
              {email}
              <button
                type="button"
                aria-label={`Remove ${email}`}
                onClick={() =>
                  setEmails((current) => current.filter((e) => e !== email))
                }
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          id="share-emails"
          value={draft}
          placeholder="name@company.com"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
        />
        <Button
          className="shrink-0"
          disabled={!canInvite}
          onClick={() => {
            onInvite(emails);
            setEmails([]);
          }}
        >
          {inviting ? 'Inviting…' : 'Invite'}
        </Button>
      </div>

      {invalid.length > 0 && (
        <p className="text-xs text-destructive">
          Remove the highlighted entries — they are not email addresses.
        </p>
      )}
    </div>
  );
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
