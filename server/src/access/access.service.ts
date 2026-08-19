import { Injectable, NotFoundException } from '@nestjs/common';
import type { DataRoom, Folder } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * The only place that decides whether a caller may read a resource.
 *
 * Both methods answer "not found" for a resource that exists but belongs to
 * someone else. A 403 would confirm the id is real, which leaks the existence
 * of other users' data.
 *
 * Each method resolves the resource first and decides afterwards, so step 05
 * can add a share branch next to the ownership branch without restructuring.
 */
@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertRoomAccess(userId: string, roomId: string): Promise<DataRoom> {
    const room = await this.prisma.dataRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || room.ownerId !== userId) {
      throw new NotFoundException('Data room not found');
    }
    return room;
  }

  async assertFolderAccess(userId: string, folderId: string): Promise<Folder> {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: { dataRoom: { select: { ownerId: true } } },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    const { dataRoom, ...plain } = folder;
    if (dataRoom.ownerId !== userId) {
      throw new NotFoundException('Folder not found');
    }
    return plain;
  }
}
