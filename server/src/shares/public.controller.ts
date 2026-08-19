import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { OptionalUser } from '../auth/optional-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { AccessService, type Viewer } from '../access/access.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { DEFAULT_PAGE_SIZE } from '../common/pagination';
import type {
  DownloadUrlDto,
  FileResponseDto,
} from '../files/dto/file-response.dto';
import type {
  PublicFolderViewDto,
  PublicShareDto,
} from './dto/share-response.dto';
import { PublicSharesService } from './public-shares.service';

@Public()
@Controller('public')
export class PublicController {
  constructor(
    private readonly access: AccessService,
    private readonly views: PublicSharesService,
  ) {}

  @Get(':token')
  async describe(
    @Param('token') token: string,
    @OptionalUser() user?: AuthUser,
  ): Promise<PublicShareDto> {
    return this.views.describe(await this.resolve(token, user));
  }

  @Get(':token/folders/:folderId/children')
  async listFolder(
    @Param('token') token: string,
    @Param('folderId', ParseUUIDPipe) folderId: string,
    @Query() query: PaginationQueryDto,
    @OptionalUser() user?: AuthUser,
  ): Promise<PublicFolderViewDto> {
    return this.views.listFolder(
      await this.resolve(token, user),
      folderId,
      query.cursor,
      query.limit ?? DEFAULT_PAGE_SIZE,
    );
  }

  @Get(':token/files/:fileId')
  async getFile(
    @Param('token') token: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @OptionalUser() user?: AuthUser,
  ): Promise<FileResponseDto> {
    return this.views.getFile(await this.resolve(token, user), fileId);
  }

  @Get(':token/files/:fileId/download-url')
  async downloadUrl(
    @Param('token') token: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @OptionalUser() user?: AuthUser,
  ): Promise<DownloadUrlDto> {
    return this.views.createDownloadUrl(
      await this.resolve(token, user),
      fileId,
    );
  }

  private resolve(token: string, user?: AuthUser) {
    const viewer: Viewer = { userId: user?.id, email: user?.email };
    return this.access.resolveShare(token, viewer);
  }
}
