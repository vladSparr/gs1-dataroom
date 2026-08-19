import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { DEFAULT_PAGE_SIZE, toPage, type Page } from '../common/pagination';
import type { RoomResponseDto } from './dto/room-response.dto';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  /**
   * A room without a root folder breaks every later query, so both rows are
   * written in one transaction. The folder id only exists after the insert,
   * which is why the path is filled in by a second statement rather than
   * being computed up front.
   */
  async create(userId: string, name: string): Promise<RoomResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const room = await tx.dataRoom.create({
        data: { name, ownerId: userId },
      });

      const root = await tx.folder.create({
        data: {
          name,
          path: '',
          depth: 0,
          dataRoomId: room.id,
          parentId: null,
        },
      });

      await tx.folder.update({
        where: { id: root.id },
        data: { path: `/${room.id}/${root.id}/` },
      });

      return this.toResponse(room, root.id);
    });
  }

  async list(
    userId: string,
    cursor: string | undefined,
    limit = DEFAULT_PAGE_SIZE,
  ): Promise<Page<RoomResponseDto>> {
    const rooms = await this.prisma.dataRoom.findMany({
      where: { ownerId: userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        folders: {
          where: { parentId: null },
          select: { id: true },
          take: 1,
        },
      },
    });

    const items = rooms.map((room) =>
      this.toResponse(room, room.folders[0]?.id ?? ''),
    );
    return toPage(items, limit);
  }

  async get(userId: string, roomId: string): Promise<RoomResponseDto> {
    const room = await this.access.assertRoomAccess(userId, roomId);
    return this.toResponse(room, await this.rootFolderId(roomId));
  }

  /**
   * The root folder mirrors the room name, so both are renamed together —
   * otherwise the first breadcrumb disagrees with the rooms list.
   */
  async rename(
    userId: string,
    roomId: string,
    name: string,
  ): Promise<RoomResponseDto> {
    await this.access.assertRoomAccess(userId, roomId);
    const rootId = await this.rootFolderId(roomId);

    const [room] = await this.prisma.$transaction([
      this.prisma.dataRoom.update({ where: { id: roomId }, data: { name } }),
      this.prisma.folder.update({ where: { id: rootId }, data: { name } }),
    ]);

    return this.toResponse(room, rootId);
  }

  async remove(userId: string, roomId: string): Promise<void> {
    await this.access.assertRoomAccess(userId, roomId);
    // Folders and files fall away through the cascades declared in the schema.
    await this.prisma.dataRoom.delete({ where: { id: roomId } });
  }

  private async rootFolderId(roomId: string): Promise<string> {
    const root = await this.prisma.folder.findFirst({
      where: { dataRoomId: roomId, parentId: null },
      select: { id: true },
    });

    if (!root) {
      throw new NotFoundException('Data room has no root folder');
    }
    return root.id;
  }

  private toResponse(
    room: { id: string; name: string; createdAt: Date; updatedAt: Date },
    rootFolderId: string,
  ): RoomResponseDto {
    return {
      id: room.id,
      name: room.name,
      rootFolderId,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}
