import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser, AuthenticatedRequest } from './auth.types';

/**
 * The caller on a `@Public()` route: present when a valid token came along,
 * undefined otherwise. Use `@CurrentUser()` wherever identity is mandatory.
 */
export const OptionalUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
