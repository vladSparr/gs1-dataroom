import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtGuard } from './auth/jwt.guard';
import { UsersModule } from './users/users.module';
import { AccessModule } from './access/access.module';
import { RoomsModule } from './rooms/rooms.module';
import { FoldersModule } from './folders/folders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AccessModule,
    RoomsModule,
    FoldersModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: JwtGuard }],
})
export class AppModule {}
