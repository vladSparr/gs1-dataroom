import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { DEFAULT_PAGE_SIZE, type Page } from '../common/pagination';
import { CreateRoomDto } from './dto/create-room.dto';
import { RenameRoomDto } from './dto/rename-room.dto';
import type { RoomResponseDto } from './dto/room-response.dto';
import type { RoomFolderDto } from './dto/room-folder.dto';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateRoomDto,
  ): Promise<RoomResponseDto> {
    return this.rooms.create(user.id, body.name);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationQueryDto,
  ): Promise<Page<RoomResponseDto>> {
    return this.rooms.list(
      user.id,
      query.cursor,
      query.limit ?? DEFAULT_PAGE_SIZE,
    );
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoomResponseDto> {
    return this.rooms.get(user.id, id);
  }

  @Get(':id/folders')
  listFolders(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoomFolderDto[]> {
    return this.rooms.listFolders(user.id, id);
  }

  @Patch(':id')
  rename(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RenameRoomDto,
  ): Promise<RoomResponseDto> {
    return this.rooms.rename(user.id, id, body.name);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.rooms.remove(user.id, id);
  }
}
