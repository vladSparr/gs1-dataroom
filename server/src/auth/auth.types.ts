import type { Request } from 'express';

/** The identity carried by a verified Supabase access token. */
export interface AuthUser {
  id: string; // JWT `sub` — the Supabase user id
  email: string;
  name?: string;
  avatarUrl?: string;
}

/** Request after `JwtGuard` has verified the bearer token. */
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
