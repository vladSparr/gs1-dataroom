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
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { CreateUploadDto } from './dto/create-upload.dto';
import { MoveFileDto } from './dto/move-file.dto';
import { RenameFileDto } from './dto/rename-file.dto';
import type {
  DownloadUrlDto,
  FileResponseDto,
  UploadTicketDto,
} from './dto/file-response.dto';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('upload-url')
  createUploadUrl(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateUploadDto,
  ): Promise<UploadTicketDto> {
    return this.files.createUploadTicket(
      user.id,
      body.folderId,
      body.name,
      body.mimeType,
    );
  }

  @Post(':id/complete')
  complete(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CompleteUploadDto,
  ): Promise<FileResponseDto> {
    return this.files.completeUpload(user.id, id, body.size);
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FileResponseDto> {
    return this.files.get(user.id, id);
  }

  @Get(':id/download-url')
  downloadUrl(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DownloadUrlDto> {
    return this.files.createDownloadUrl(user.id, id);
  }

  @Patch(':id')
  rename(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RenameFileDto,
  ): Promise<FileResponseDto> {
    return this.files.rename(user.id, id, body.name);
  }

  @Patch(':id/move')
  move(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: MoveFileDto,
  ): Promise<FileResponseDto> {
    return this.files.move(user.id, id, body.folderId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.files.remove(user.id, id);
  }
}
