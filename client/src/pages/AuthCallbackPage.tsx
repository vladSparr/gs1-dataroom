import { Link, Navigate, useLocation } from 'react-router-dom';
import { Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/useAuth';
import { takeReturnPath } from '@/auth/returnPath';

export function AuthCallbackPage() {
  const { session } = useAuth();
  const location = useLocation();

  if (session) {
    // A restricted share link parks its path before leaving for Google.
    return <Navigate to={takeReturnPath() ?? '/'} replace />;
  }

  // Supabase reports a refused consent on the URL. Without this the page would
  // spin forever waiting for a session that is never coming.
  const error = readAuthError(location.search, location.hash);
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-xl border bg-card p-8 text-center text-card-foreground shadow-sm">
          <h1 className="text-base font-semibold tracking-tight">
            Sign-in was not completed
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button asChild className="mt-6 w-full" variant="outline">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}

/**
 * The error may arrive as a query string or as a URL fragment depending on the
 * flow. The session itself is left to `detectSessionInUrl` — parsing the
 * fragment by hand is a reliable source of race conditions.
 */
function readAuthError(search: string, hash: string): string | null {
  for (const source of [search, hash]) {
    const params = new URLSearchParams(source.replace(/^[?#]/, ''));
    const description = params.get('error_description') ?? params.get('error');

    if (description) {
      return description.replace(/\+/g, ' ');
    }
  }
  return null;
}
