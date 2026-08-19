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
      return;
    }
  }

  private bearerToken(request: AuthenticatedRequest): string | null {
    const header = request.headers.authorization;

    return header?.startsWith(BEARER_PREFIX)
      ? header.slice(BEARER_PREFIX.length).trim()
      : null;
  }
}
