import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { AuthUser } from './auth.types';

/** Supabase issues tokens for the `authenticated` audience. */
const AUDIENCE = 'authenticated';

/** A cold instance's clock can lag far enough to reject a fresh token. */
const CLOCK_TOLERANCE_SECONDS = 5;

/**
 * Verifies Supabase access tokens against the project's public JWKS.
 * We never issue tokens ourselves, so there is no signing key on this side.
 */
@Injectable()
export class JwtService {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;

  constructor(config: ConfigService) {
    const supabaseUrl = config.getOrThrow<string>('SUPABASE_URL');
    const jwksUrl = config.getOrThrow<string>('SUPABASE_JWKS_URL');

    this.issuer = `${supabaseUrl.replace(/\/+$/, '')}/auth/v1`;
    // Built once: the set caches keys and refetches only on an unknown `kid`.
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
      // The underlying jose message describes our verification setup — keep it internal.
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
    // Claim names differ per provider; take the first one that is present.
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
