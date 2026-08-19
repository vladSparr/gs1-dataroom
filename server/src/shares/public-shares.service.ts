import { Injectable, NotFoundException } from '@nestjs/common';
import type { Share } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { StorageService } from '../storage/storage.service';
import { DEFAULT_PAGE_SIZE } from '../common/pagination';
import {
  ancestorIds,
  toFileResponse,
  toFolderResponse,
} from '../common/mappers';
import type { BreadcrumbDto } from '../folders/dto/folder-response.dto';
import type {
  DownloadUrlDto,
  FileResponseDto,
} from '../files/dto/file-response.dto';
import type {
  PublicFolderViewDto,
  PublicShareDto,
} from './dto/share-response.dto';

const DOWNLOAD_TTL_SECONDS = 300;

/**
 * Read-only views behind a share token. Every method takes an already-resolved
 * `Share` and re-checks that the requested resource sits inside its subtree —
 * without that, a token for a deep folder would let a caller pass arbitrary
 * ids and read the whole room.
 */
@Injectable()
export class PublicSharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly storage: StorageService,
  ) {}

  async describe(share: Share): Promise<PublicShareDto> {
    const room = await this.prisma.dataRoom.findUnique({
      where: { id: share.dataRoomId },
      select: { name: true, owner: { select: { name: true } } },
    });

    if (!room) {
      throw new NotFoundException('This link is no longer active');
    }
    const ownerName = room.owner.name;

    if (share.targetType === 'FILE') {
      const file = await this.access.assertShareCoversFile(
        share,
        share.targetId,
      );
      return {
        targetType: share.targetType,
        mode: share.mode,
        name: file.name,
        ownerName,
        rootFolderId: null,
        file: toFileResponse(file),
      };
    }

    // A room share opens on its root folder; a folder share on itself.
    const entry =
      share.targetType === 'DATA_ROOM'
        ? await this.prisma.folder.findFirst({
            where: { dataRoomId: share.dataRoomId, parentId: null },
          })
        : await this.prisma.folder.findUnique({
            where: { id: share.targetId },
          });

    if (!entry) {
      throw new NotFoundException('This link is no longer active');
    }

    return {
      targetType: share.targetType,
      mode: share.mode,
      name: entry.name,
      ownerName,
      rootFolderId: entry.id,
      file: null,
    };
  }

  async listFolder(
    share: Share,
    folderId: string,
    cursor: string | undefined,
    limit = DEFAULT_PAGE_SIZE,
  ): Promise<PublicFolderViewDto> {
    const folder = await this.access.assertShareCoversFolder(share, folderId);

    const cursorIsFile = cursor
      ? (await this.prisma.file.count({ where: { id: cursor, folderId } })) > 0
      : false;

    const folders = cursorIsFile
      ? []
      : await this.prisma.folder.findMany({
          where: { parentId: folderId },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          take: limit,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });

    const remaining = limit - folders.length;
    const files =
      remaining > 0
        ? await this.prisma.file.findMany({
            where: { folderId, status: 'READY' },
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
            take: remaining,
            ...(cursorIsFile ? { cursor: { id: cursor }, skip: 1 } : {}),
          })
        : [];

    const last = files.at(-1) ?? folders.at(-1);
    const full = folders.length + files.length === limit;

    return {
      id: folder.id,
      name: folder.name,
      breadcrumbs: await this.clippedBreadcrumbs(share, folder.path),
      folders: folders.map((child) => toFolderResponse(child)),
      files: files.map((file) => toFileResponse(file)),
      nextCursor: full && last ? last.id : null,
    };
  }

  async getFile(share: Share, fileId: string): Promise<FileResponseDto> {
    return toFileResponse(
      await this.access.assertShareCoversFile(share, fileId),
    );
  }

  /** The bucket is private, so a signed URL is the only way bytes reach a visitor. */
  async createDownloadUrl(
    share: Share,
    fileId: string,
  ): Promise<DownloadUrlDto> {
    const file = await this.access.assertShareCoversFile(share, fileId);

    return {
      url: await this.storage.createSignedDownloadUrl(
        file.storageKey,
        DOWNLOAD_TTL_SECONDS,
      ),
      expiresAt: new Date(
        Date.now() + DOWNLOAD_TTL_SECONDS * 1000,
      ).toISOString(),
    };
  }

  /**
   * Crumbs stop at the share root: a recipient must never see the names of
   * folders above what was shared with them.
   */
  private async clippedBreadcrumbs(
    share: Share,
    path: string,
  ): Promise<BreadcrumbDto[]> {
    const ids = ancestorIds(path);
    // targetPath segments minus the room id; a room share contributes none.
    const rootDepth = ancestorIds(share.targetPath).length;
    const visible = ids.slice(Math.max(0, rootDepth - 1));

    const found = await this.prisma.folder.findMany({
      where: { id: { in: visible } },
      select: { id: true, name: true },
    });

    const byId = new Map(found.map((crumb) => [crumb.id, crumb]));
    return visible
      .map((id) => byId.get(id))
      .filter((crumb): crumb is BreadcrumbDto => crumb !== undefined);
  }
}
