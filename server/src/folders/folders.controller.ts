import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { DEFAULT_PAGE_SIZE } from '../common/pagination';
import { CreateFolderDto } from './dto/create-folder.dto';
import { RenameFolderDto } from './dto/rename-folder.dto';
import type {
  DeleteFolderResultDto,
  FolderChildrenDto,
  FolderDetailDto,
  FolderResponseDto,
  FolderStatsDto,
} from './dto/folder-response.dto';
import { FoldersService } from './folders.service';

@Controller('folders')
export class FoldersController {
  constructor(private readonly folders: FoldersService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateFolderDto,
  ): Promise<FolderResponseDto> {
    return this.folders.create(user.id, body.parentId, body.name);
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FolderDetailDto> {
    return this.folders.get(user.id, id);
  }

  @Get(':id/children')
  listChildren(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ): Promise<FolderChildrenDto> {
    return this.folders.listChildren(
      user.id,
      id,
      query.cursor,
      query.limit ?? DEFAULT_PAGE_SIZE,
    );
  }

  @Get(':id/stats')
  getStats(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FolderStatsDto> {
    return this.folders.getStats(user.id, id);
  }

  @Patch(':id')
  rename(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RenameFolderDto,
  ): Promise<FolderResponseDto> {
    return this.folders.rename(user.id, id, body.name);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteFolderResultDto> {
    return this.folders.remove(user.id, id);
  }
}
