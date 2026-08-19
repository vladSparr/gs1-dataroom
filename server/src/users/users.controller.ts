import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { UsersService } from './users.service';

interface MeResponse {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthUser): Promise<MeResponse> {
    const row = await this.users.upsertFromToken(user);

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatarUrl,
    };
  }
}
