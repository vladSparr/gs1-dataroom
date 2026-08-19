import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Share, ShareMode, ShareTargetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import type {
  ShareResponseDto,
  SharedWithMeItemDto,
} from './dto/share-response.dto';

@Injectable()
export class SharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async create(
    userId: string,
    targetType: ShareTargetType,
    targetId: string,
    mode: ShareMode,
    emails: string[] = [],
  ): Promise<ShareResponseDto> {
    const { dataRoomId, targetPath } = await this.resolveTarget(
      userId,
      targetType,
      targetId,
    );

    if (mode === 'RESTRICTED' && emails.length === 0) {
      throw new BadRequestException(
        'Add at least one email address, or use a public link instead.',
      );
    }

    const unique = [...new Set(emails)];
    // Someone can be invited before they ever sign in, so the account is
    // linked when it exists and matched on email when it does not.
    const known = await this.prisma.user.findMany({
      where: { email: { in: unique } },
      select: { id: true, email: true },
    });
    const userIdByEmail = new Map(known.map((user) => [user.email, user.id]));

    const share = await this.prisma.share.create({
      data: {
        // 32 random bytes: never derived from an id or a timestamp, and never
        // the caller's session token, which has a different lifetime and would
        // leak the sharer's identity.
        token: randomBytes(32).toString('base64url'),
        targetType,
        targetId,
        targetPath,
        mode,
        dataRoomId,
        createdById: userId,
        ...(mode === 'RESTRICTED'
          ? {
              grants: {
                create: unique.map((email) => ({
                  email,
                  userId: userIdByEmail.get(email) ?? null,
                })),
              },
            }
          : {}),
      },
      include: { grants: { select: { email: true } } },
    });

    return this.toResponse(
      share,
      share.grants.map((grant) => grant.email),
    );
  }

  async listForTarget(
    userId: string,
    targetType: ShareTargetType,
    targetId: string,
  ): Promise<ShareResponseDto[]> {
    await this.resolveTarget(userId, targetType, targetId);

    const shares = await this.prisma.share.findMany({
      where: { targetType, targetId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { grants: { select: { email: true } } },
    });

    return shares.map((share) =>
      this.toResponse(
        share,
        share.grants.map((grant) => grant.email),
      ),
    );
  }

  /** Revoking keeps the row, so "who had access when" stays answerable. */
  async revoke(userId: string, shareId: string): Promise<void> {
    const share = await this.prisma.share.findUnique({
      where: { id: shareId },
      include: { dataRoom: { select: { ownerId: true } } },
    });

    if (!share || share.dataRoom.ownerId !== userId) {
      throw new NotFoundException('Share not found');
    }
    if (share.revokedAt !== null) {
      return;
    }

    await this.prisma.share.update({
      where: { id: shareId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Grants are matched by email, not by user id, because the invitation may
   * predate the account. Any grant that now resolves to a real user is linked
   * on the way past.
   */
  async listSharedWithMe(
    userId: string,
    email: string,
  ): Promise<SharedWithMeItemDto[]> {
    const normalised = email.trim().toLowerCase();

    const grants = await this.prisma.shareGrant.findMany({
      where: { email: normalised, share: { revokedAt: null } },
      orderBy: { createdAt: 'desc' },
      include: {
        share: {
          include: {
            dataRoom: {
              select: { name: true, owner: { select: { name: true } } },
            },
          },
        },
      },
    });

    const unlinked = grants.filter((grant) => grant.userId === null);
    if (unlinked.length > 0) {
      await this.prisma.shareGrant.updateMany({
        where: { id: { in: unlinked.map((grant) => grant.id) } },
        data: { userId },
      });
    }

    const named = await this.nameTargets(grants.map((grant) => grant.share));

    return grants.map((grant) => ({
      shareId: grant.share.id,
      token: grant.share.token,
      targetType: grant.share.targetType,
      targetId: grant.share.targetId,
      name: named.get(grant.share.id) ?? grant.share.dataRoom.name,
      roomName: grant.share.dataRoom.name,
      ownerName: grant.share.dataRoom.owner.name,
      sharedAt: grant.share.createdAt,
    }));
  }

  /**
   * Confirms the caller owns the room holding the target and works out the
   * subtree the share covers. A file's share is scoped to its parent folder's
   * path; `AccessService` adds the id check that makes it a single file.
   */
  private async resolveTarget(
    userId: string,
    targetType: ShareTargetType,
    targetId: string,
  ): Promise<{ dataRoomId: string; targetPath: string }> {
    if (targetType === 'DATA_ROOM') {
      const room = await this.access.assertRoomAccess(userId, targetId);
      return { dataRoomId: room.id, targetPath: `/${room.id}/` };
    }

    if (targetType === 'FOLDER') {
      const folder = await this.access.assertFolderAccess(userId, targetId);
      return { dataRoomId: folder.dataRoomId, targetPath: folder.path };
    }

    const file = await this.prisma.file.findUnique({
      where: { id: targetId },
      include: { folder: { select: { path: true } } },
    });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.access.assertFolderAccess(userId, file.folderId);
    return { dataRoomId: file.dataRoomId, targetPath: file.folder.path };
  }

  /** Display names for a mixed batch of targets, two queries regardless of size. */
  private async nameTargets(shares: Share[]): Promise<Map<string, string>> {
    const folderIds = shares
      .filter((share) => share.targetType === 'FOLDER')
      .map((share) => share.targetId);
    const fileIds = shares
      .filter((share) => share.targetType === 'FILE')
      .map((share) => share.targetId);

    const [folders, files] = await Promise.all([
      folderIds.length > 0
        ? this.prisma.folder.findMany({
            where: { id: { in: folderIds } },
            select: { id: true, name: true },
          })
        : [],
      fileIds.length > 0
        ? this.prisma.file.findMany({
            where: { id: { in: fileIds } },
            select: { id: true, name: true },
          })
        : [],
    ]);

    const byTargetId = new Map(
      [...folders, ...files].map((row) => [row.id, row.name]),
    );

    return new Map(
      shares.map((share) => [share.id, byTargetId.get(share.targetId) ?? '']),
    );
  }

  private toResponse(share: Share, grantedTo: string[]): ShareResponseDto {
    return {
      id: share.id,
      token: share.token,
      targetType: share.targetType,
      targetId: share.targetId,
      mode: share.mode,
      role: share.role,
      grantedTo,
      createdAt: share.createdAt,
    };
  }
}
