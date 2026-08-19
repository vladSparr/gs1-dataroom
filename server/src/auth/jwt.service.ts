import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { AuthUser } from './auth.types';

const AUDIENCE = 'authenticated';

const CLOCK_TOLERANCE_SECONDS = 5;

@Injectable()
export class JwtService {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;

  constructor(config: ConfigService) {
    const supabaseUrl = config.getOrThrow<string>('SUPABASE_URL');
    const jwksUrl = config.getOrThrow<string>('SUPABASE_JWKS_URL');

    this.issuer = `${supabaseUrl.replace(/\/+$/, '')}/auth/v1`;
    this.jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  async verify(token: string): Promise<AuthUser> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: AUDIENCE,
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
      });
      return toAuthUser(payload);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

function toAuthUser(payload: JWTPayload): AuthUser {
  const id = readString(payload.sub);
  const email = readString(payload.email);

  if (!id || !email) {
    throw new UnauthorizedException('Token is missing a subject or email');
  }

  const metadata = readRecord(payload.user_metadata);

  return {
    id,
    email,
    name: readString(metadata.full_name) ?? readString(metadata.name),
    avatarUrl: readString(metadata.avatar_url) ?? readString(metadata.picture),
  };
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};
}
