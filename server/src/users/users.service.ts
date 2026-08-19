import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/auth.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mirrors the verified token into `users`. Creates the row on first sign-in
   * and refreshes it afterwards, so a changed Google name or avatar propagates.
   */
  async upsertFromToken(user: AuthUser): Promise<User> {
    const profile = {
      email: user.email,
      name: user.name ?? null,
      avatarUrl: user.avatarUrl ?? null,
    };

    return this.prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, ...profile },
      update: profile,
    });
  }
}
