const KEY = 'gs1:return-path';

export function rememberReturnPath(path: string): void {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    return;
  }
}

export function takeReturnPath(): string | null {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return path?.startsWith('/') && !path.startsWith('//') ? path : null;
  } catch {
    return null;
  }
}
