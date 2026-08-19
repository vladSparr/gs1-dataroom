import { supabase } from './supabase';

const BASE_URL = import.meta.env.VITE_API_URL;

/** A non-2xx response from the API, carrying the status and the server's message. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * The one HTTP helper for the whole app. Do not write a second one.
 *
 * The access token is read from the live session on every call: it expires
 * after an hour and supabase-js rotates it in the background, so capturing it
 * once in a module variable or in state would sign the user out mid-session.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init?.headers);

  const token = data.session?.access_token;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    const message = (body as { message?: unknown }).message;

    if (typeof message === 'string') {
      return message;
    }
    // class-validator reports one message per failed constraint.
    if (Array.isArray(message)) {
      return message.join(', ');
    }
  } catch {
    // Body was empty or not JSON — fall through to the status line.
  }
  return response.statusText || `Request failed with status ${response.status}`;
}
