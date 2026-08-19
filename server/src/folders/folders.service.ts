import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma, type Folder } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { nextAvailableName } from '../common/naming';
import { DEFAULT_PAGE_SIZE, toPage, type Page } from '../common/pagination';
import type {
  BreadcrumbDto,
  DeleteFolderResultDto,
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
  ) {}

  async get(userId: string, folderId: string): Promise<FolderDetailDto> {
    const folder = await this.access.assertFolderAccess(userId, folderId);

    return {
      ...this.toResponse(folder),
      breadcrumbs: await this.breadcrumbs(folder),
    };
  }

  async listChildren(
    userId: string,
    folderId: string,
    cursor: string | undefined,
    limit = DEFAULT_PAGE_SIZE,
  ): Promise<Page<FolderResponseDto>> {
    await this.access.assertFolderAccess(userId, folderId);

    const children = await this.prisma.folder.findMany({
      where: { parentId: folderId },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return toPage(
      children.map((child) => this.toResponse(child)),
      limit,
    );
  }

  async create(
    userId: string,
    parentId: string,
    name: string,
  ): Promise<FolderResponseDto> {
    const parent = await this.access.assertFolderAccess(userId, parentId);
    const resolved = await this.resolveName(parentId, name);

    try {
      // The path needs the new id, so it is written once the row exists.
      const created = await this.prisma.folder.create({
        data: {
          name: resolved,
          path: '',
          depth: parent.depth + 1,
          dataRoomId: parent.dataRoomId,
          parentId: parent.id,
        },
      });

      return this.toResponse(
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
      return this.toResponse(folder);
    }

    try {
      // `path` is built from ids, so a rename touches no descendant rows.
      return this.toResponse(
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

    // Counted before the delete so the response can state what disappeared.
    const deleted = await this.statsFor(folder);
    await this.prisma.folder.delete({ where: { id: folderId } });

    return { deleted };
  }

  async getStats(userId: string, folderId: string): Promise<FolderStatsDto> {
    const folder = await this.access.assertFolderAccess(userId, folderId);
    return this.statsFor(folder);
  }

  /**
   * Two indexed prefix queries instead of a recursive walk. `folder.path`
   * already contains the folder itself, so the folder count excludes it
   * explicitly.
   */
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
      // `_sum` is null when nothing matched.
      totalSize: (files._sum.size ?? BigInt(0)).toString(),
    };
  }

  /**
   * The path is an id chain, so the whole ancestor line is fetched in one
   * query and reordered to match — no walking `parentId` in a loop.
   */
  private async breadcrumbs(folder: Folder): Promise<BreadcrumbDto[]> {
    const ids = folder.path.split('/').filter(Boolean).slice(1);

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

  /** Two clients can race past the pre-check; the constraint is the backstop. */
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

  private toResponse(folder: Folder): FolderResponseDto {
    return {
      id: folder.id,
      name: folder.name,
      dataRoomId: folder.dataRoomId,
      parentId: folder.parentId,
      depth: folder.depth,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }
}
