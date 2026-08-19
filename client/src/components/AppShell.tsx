import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LogOutIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/sonner';
import { apiFetch } from '@/lib/api';
import type { Me } from '@/api/types';
import { useAuth } from '@/auth/useAuth';

export function AppShell() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // This is also what creates the `users` row on a first sign-in.
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<Me>('/me'),
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      queryClient.clear();
      navigate('/login', { replace: true });
    } catch {
      toast.error('Could not sign out. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            GS1 Data Room
          </Link>
          <NavLink
            to="/shared-with-me"
            className={({ isActive }) =>
              isActive
                ? 'text-sm font-medium text-foreground'
                : 'text-sm text-muted-foreground transition-colors hover:text-foreground'
            }
          >
            Shared with me
          </NavLink>
        </nav>

        {me.isPending ? (
          <Skeleton className="size-8 rounded-full" />
        ) : me.isError ? (
          // Never trap the user behind a failed profile load.
          <Button variant="ghost" size="sm" onClick={() => void handleSignOut()}>
            <LogOutIcon />
            Sign out
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Account menu"
              >
                <Avatar className="size-8">
                  {me.data.avatarUrl && (
                    <AvatarImage
                      src={me.data.avatarUrl}
                      alt={me.data.name ?? me.data.email}
                    />
                  )}
                  <AvatarFallback>{initials(me.data)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="truncate text-sm font-medium">
                  {me.data.name ?? me.data.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {me.data.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void handleSignOut()}>
                <LogOutIcon />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        {me.isPending ? (
          <>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-3 h-4 w-80" />
          </>
        ) : me.isError ? (
          <div className="rounded-xl border bg-card p-8 text-center text-card-foreground">
            <h2 className="text-base font-semibold tracking-tight">
              Could not load your profile
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {me.error instanceof Error
                ? me.error.message
                : 'The server did not respond.'}
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => void me.refetch()}
              disabled={me.isFetching}
            >
              {me.isFetching ? 'Retrying…' : 'Try again'}
            </Button>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      <Toaster />
    </div>
  );
}

function initials(user: Me): string {
  const source = user.name?.trim() || user.email;

  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
