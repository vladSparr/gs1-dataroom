import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { DataRoom, File, Folder, Share } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Lets the client tell "sign in" apart from "wrong account". */
export const NOT_GRANTED_CODE = 'SHARE_NOT_GRANTED';

/** Who is asking, when the request arrives on a public share route. */
export interface Viewer {
  userId?: string;
  email?: string;
}

/**
 * The only place that decides whether a caller may read a resource.
 *
 * Owner-facing methods answer "not found" for a resource that exists but
 * belongs to someone else — a 403 would confirm the id is real and leak the
 * existence of other users' data.
 *
 * Share-facing methods resolve a token to an active share, then check that the
 * requested resource sits inside that share's subtree. The subtree test is a
 * prefix comparison on the materialised path: a share on `/room/A/B/` covers
 * `/room/A/B/C/` and nothing at `/room/A/`. One string comparison, no recursion.
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

  /**
   * Resolves a share token for a visitor.
   *
   * An unknown token and a revoked one are deliberately indistinguishable —
   * both are simply "no longer active". A restricted share separates the two
   * failures that matter to a real person: not signed in at all, versus signed
   * in with an account that was never invited.
   */
  async resolveShare(token: string, viewer: Viewer): Promise<Share> {
    const share = await this.prisma.share.findUnique({
      where: { token },
      include: { dataRoom: { select: { ownerId: true } } },
    });

    if (!share || share.revokedAt !== null) {
      throw new NotFoundException('This link is no longer active');
    }

    const { dataRoom, ...plain } = share;

    // The owner always gets through their own link, invited or not.
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

    // The invite may predate the account; record the link once it exists.
    if (!grant.userId && viewer.userId) {
      await this.prisma.shareGrant.update({
        where: { id: grant.id },
        data: { userId: viewer.userId },
      });
    }
    return plain;
  }

  /** A folder is visible when its path sits inside the share's subtree. */
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

  /**
   * Files need one extra test. A single-file share stores its parent folder's
   * path as `targetPath`, so prefix matching alone would expose every sibling
   * in that folder — the one case where the path check is not sufficient.
   */
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
