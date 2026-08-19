import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from './auth.types';
import { IS_PUBLIC_KEY } from './public.decorator';
import { JwtService } from './jwt.service';

const BEARER_PREFIX = 'Bearer ';

/**
 * Global guard: every route requires a valid Supabase token unless it is
 * marked `@Public()`. Private-by-default means a missing decorator hides a
 * route rather than exposing it.
 */
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // `@Public()` means the token is not required — not that it is ignored.
      // A restricted share link has to know who is looking at it, and the same
      // page must still render for a signed-out visitor.
      await this.attachViewerIfSignedIn(request);
      return true;
    }

    const token = this.bearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    request.user = await this.jwt.verify(token);
    return true;
  }

  private async attachViewerIfSignedIn(
    request: AuthenticatedRequest,
  ): Promise<void> {
    const token = this.bearerToken(request);
    if (!token) return;

    try {
      request.user = await this.jwt.verify(token);
    } catch {
      // An expired or malformed token on a public route is simply anonymous.
    }
  }

  private bearerToken(request: AuthenticatedRequest): string | null {
    const header = request.headers.authorization;

    return header?.startsWith(BEARER_PREFIX)
      ? header.slice(BEARER_PREFIX.length).trim()
      : null;
  }
}
