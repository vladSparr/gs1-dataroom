const KEY = 'gs1:return-path';

/**
 * Google sign-in leaves the app and comes back through /auth/callback, which
 * loses wherever the visitor was. A restricted share link has to survive that
 * round trip, so the path is parked in sessionStorage across it.
 */
export function rememberReturnPath(path: string): void {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Private modes can refuse storage; falling back to "/" is acceptable.
  }
}

export function takeReturnPath(): string | null {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    // Only same-origin paths, never an absolute URL supplied from outside.
    return path?.startsWith('/') && !path.startsWith('//') ? path : null;
  } catch {
    return null;
  }
}
