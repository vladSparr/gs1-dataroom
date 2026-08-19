import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { CreateShareDto } from './dto/create-share.dto';
import { ShareQueryDto } from './dto/share-query.dto';
import type {
  ShareResponseDto,
  SharedWithMeItemDto,
} from './dto/share-response.dto';
import { SharesService } from './shares.service';

@Controller()
export class SharesController {
  constructor(private readonly shares: SharesService) {}

  @Post('shares')
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateShareDto,
  ): Promise<ShareResponseDto> {
    return this.shares.create(
      user.id,
      body.targetType,
      body.targetId,
      body.mode,
      body.emails ?? [],
    );
  }

  @Get('shares')
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ShareQueryDto,
  ): Promise<ShareResponseDto[]> {
    return this.shares.listForTarget(user.id, query.targetType, query.targetId);
  }

  @Delete('shares/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.shares.revoke(user.id, id);
  }

  @Get('shared-with-me')
  sharedWithMe(@CurrentUser() user: AuthUser): Promise<SharedWithMeItemDto[]> {
    return this.shares.listSharedWithMe(user.id, user.email);
  }
}
