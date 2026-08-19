import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import type { MeResponseDto } from './dto/me-response.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthUser): Promise<MeResponseDto> {
    const row = await this.users.upsertFromToken(user);

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatarUrl,
    };
  }
}
