import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma, type Folder } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { StorageService } from '../storage/storage.service';
import { nextAvailableName } from '../common/naming';
import { DEFAULT_PAGE_SIZE } from '../common/pagination';
import {
  ancestorIds,
  toFileResponse,
  toFolderResponse,
} from '../common/mappers';
import type {
  BreadcrumbDto,
  DeleteFolderResultDto,
  FolderChildrenDto,
  FolderDetailDto,
  FolderResponseDto,
  FolderStatsDto,
} from './dto/folder-response.dto';

const UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class FoldersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly storage: StorageService,
  ) {}

  async get(userId: string, folderId: string): Promise<FolderDetailDto> {
    const folder = await this.access.assertFolderAccess(userId, folderId);

    return {
      ...toFolderResponse(folder),
      breadcrumbs: await this.breadcrumbs(folder),
    };
  }

  async listChildren(
    userId: string,
    folderId: string,
    cursor: string | undefined,
    limit = DEFAULT_PAGE_SIZE,
  ): Promise<FolderChildrenDto> {
    await this.access.assertFolderAccess(userId, folderId);

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
      folders: folders.map((folder) => toFolderResponse(folder)),
      files: files.map((file) => toFileResponse(file)),
      nextCursor: full && last ? last.id : null,
    };
  }

  async create(
    userId: string,
    parentId: string,
    name: string,
  ): Promise<FolderResponseDto> {
    const parent = await this.access.assertFolderAccess(userId, parentId);
    const resolved = await this.resolveName(parentId, name);

    try {
      const created = await this.prisma.folder.create({
        data: {
          name: resolved,
          path: '',
          depth: parent.depth + 1,
          dataRoomId: parent.dataRoomId,
          parentId: parent.id,
        },
      });

      return toFolderResponse(
        await this.prisma.folder.update({
          where: { id: created.id },
          data: { path: `${parent.path}${created.id}/` },
        }),
      );
    } catch (error) {
      throw this.translateNameConflict(error, resolved);
    }
  }

  async rename(
    userId: string,
    folderId: string,
    name: string,
  ): Promise<FolderResponseDto> {
    const folder = await this.access.assertFolderAccess(userId, folderId);

    if (folder.name === name) {
      return toFolderResponse(folder);
    }

    try {
      return toFolderResponse(
        await this.prisma.folder.update({
          where: { id: folderId },
          data: { name },
        }),
      );
    } catch (error) {
      throw this.translateNameConflict(error, name);
    }
  }

  async remove(
    userId: string,
    folderId: string,
  ): Promise<DeleteFolderResultDto> {
    const folder = await this.access.assertFolderAccess(userId, folderId);

    if (folder.parentId === null) {
      throw new BadRequestException(
        'The root folder cannot be deleted. Delete the data room instead.',
      );
    }

    const deleted = await this.statsFor(folder);

    const doomed = await this.prisma.file.findMany({
      where: { folder: { path: { startsWith: folder.path } } },
      select: { storageKey: true },
    });

    await this.storage.remove(doomed.map((file) => file.storageKey));
    await this.prisma.folder.delete({ where: { id: folderId } });

    return { deleted };
  }

  async getStats(userId: string, folderId: string): Promise<FolderStatsDto> {
    const folder = await this.access.assertFolderAccess(userId, folderId);
    return this.statsFor(folder);
  }

  private async statsFor(folder: Folder): Promise<FolderStatsDto> {
    const prefix = folder.path;

    const [folderCount, files] = await this.prisma.$transaction([
      this.prisma.folder.count({
        where: { path: { startsWith: prefix }, id: { not: folder.id } },
      }),
      this.prisma.file.aggregate({
        _count: true,
        _sum: { size: true },
        where: { status: 'READY', folder: { path: { startsWith: prefix } } },
      }),
    ]);

    return {
      folderCount,
      fileCount: files._count,
      totalSize: (files._sum.size ?? BigInt(0)).toString(),
    };
  }

  private async breadcrumbs(folder: Folder): Promise<BreadcrumbDto[]> {
    const ids = ancestorIds(folder.path);

    const found = await this.prisma.folder.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });

    const byId = new Map(found.map((crumb) => [crumb.id, crumb]));
    return ids
      .map((id) => byId.get(id))
      .filter((crumb): crumb is BreadcrumbDto => crumb !== undefined);
  }

  private async resolveName(parentId: string, name: string): Promise<string> {
    const siblings = await this.prisma.folder.findMany({
      where: { parentId },
      select: { name: true },
    });

    return nextAvailableName(name, new Set(siblings.map((s) => s.name)));
  }

  private translateNameConflict(error: unknown, name: string): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === UNIQUE_VIOLATION
    ) {
      return new ConflictException(
        `A folder named "${name}" already exists here.`,
      );
    }
    return error;
  }
}
