import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser, AuthenticatedRequest } from './auth.types';

export const OptionalUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
