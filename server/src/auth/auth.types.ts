import type { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
