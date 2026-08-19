import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { DataRoom, File, Folder, Share } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const NOT_GRANTED_CODE = 'SHARE_NOT_GRANTED';

export interface Viewer {
  userId?: string;
  email?: string;
}

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

  async resolveShare(token: string, viewer: Viewer): Promise<Share> {
    const share = await this.prisma.share.findUnique({
      where: { token },
      include: { dataRoom: { select: { ownerId: true } } },
    });

    if (!share || share.revokedAt !== null) {
      throw new NotFoundException('This link is no longer active');
    }

    const { dataRoom, ...plain } = share;

    if (viewer.userId && dataRoom.ownerId === viewer.userId) {
      return plain;
    }
    if (share.mode === 'PUBLIC_LINK') {
      return plain;
    }

    if (!viewer.email) {
      throw new UnauthorizedException(
        'This item was shared with specific people. Sign in to open it.',
      );
    }

    const grant = await this.prisma.shareGrant.findFirst({
      where: { shareId: share.id, email: viewer.email.trim().toLowerCase() },
      select: { id: true, userId: true },
    });

    if (!grant) {
      throw new ForbiddenException({
        code: NOT_GRANTED_CODE,
        message: 'This account does not have access to this item.',
        statusCode: 403,
      });
    }

    if (!grant.userId && viewer.userId) {
      await this.prisma.shareGrant.update({
        where: { id: grant.id },
        data: { userId: viewer.userId },
      });
    }
    return plain;
  }

  async assertShareCoversFolder(
    share: Share,
    folderId: string,
  ): Promise<Folder> {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (
      !folder ||
      folder.dataRoomId !== share.dataRoomId ||
      !folder.path.startsWith(share.targetPath)
    ) {
      throw new NotFoundException('Folder not found');
    }
    return folder;
  }

  async assertShareCoversFile(share: Share, fileId: string): Promise<File> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: { folder: { select: { path: true } } },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const { folder, ...plain } = file;

    if (
      file.status !== 'READY' ||
      file.dataRoomId !== share.dataRoomId ||
      !folder.path.startsWith(share.targetPath)
    ) {
      throw new NotFoundException('File not found');
    }
    if (share.targetType === 'FILE' && share.targetId !== fileId) {
      throw new NotFoundException('File not found');
    }
    return plain;
  }
}
