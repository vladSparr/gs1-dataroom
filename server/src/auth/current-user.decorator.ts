import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthUser, AuthenticatedRequest } from './auth.types';

/**
 * Injects the identity `JwtGuard` resolved from the token.
 * Identity is never read from the body or the query string.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException();
    }
    return request.user;
  },
);
