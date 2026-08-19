import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('health')
  async health(): Promise<{ ok: true; db: boolean; ts: string }> {
    let db = false;
    try {
      await this.prisma.$queryRaw<unknown[]>`SELECT 1`;
      db = true;
    } catch {
      db = false;
    }
    return { ok: true, db, ts: new Date().toISOString() };
  }
}
