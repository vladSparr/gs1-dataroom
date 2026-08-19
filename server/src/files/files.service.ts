import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type File } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { StorageService } from '../storage/storage.service';
import { nextAvailableName, splitExtension } from '../common/naming';
import { toFileResponse } from '../common/mappers';
import type {
  DownloadUrlDto,
  FileResponseDto,
  UploadTicketDto,
} from './dto/file-response.dto';

const UNIQUE_VIOLATION = 'P2002';
const PDF_MIME = 'application/pdf';
const DOWNLOAD_TTL_SECONDS = 300;

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Creates the row before signing: the storage key contains the file id, so
   * the id has to exist first. The row stays PENDING and invisible until the
   * browser reports the transfer finished.
   */
  async createUploadTicket(
    userId: string,
    folderId: string,
    name: string,
    mimeType: string,
  ): Promise<UploadTicketDto> {
    const folder = await this.access.assertFolderAccess(userId, folderId);

    if (mimeType !== PDF_MIME) {
      throw new BadRequestException('Only PDF files can be uploaded.');
    }

    const resolved = await this.resolveName(folderId, name);

    const file = await this.prisma.file.create({
      data: {
        name: resolved,
        mimeType,
        size: BigInt(0),
        status: 'PENDING',
        dataRoomId: folder.dataRoomId,
        folderId,
        // Placeholder: the key needs the generated id.
        storageKey: `pending/${crypto.randomUUID()}`,
      },
    });

    // Names never appear in storage keys, so a rename touches the database only.
    const storageKey = `${folder.dataRoomId}/${file.id}`;
    await this.prisma.file.update({
      where: { id: file.id },
      data: { storageKey },
    });

    const { signedUrl, token } =
      await this.storage.createSignedUploadUrl(storageKey);

    return { fileId: file.id, name: resolved, uploadUrl: signedUrl, token };
  }

  /** Flips PENDING to READY once the object is actually in the bucket. */
  async completeUpload(
    userId: string,
    fileId: string,
    size: number,
  ): Promise<FileResponseDto> {
    const file = await this.assertFileAccess(userId, fileId);

    if (!(await this.storage.exists(file.storageKey))) {
      throw new BadRequestException('The upload did not reach storage.');
    }

    return toFileResponse(
      await this.prisma.file.update({
        where: { id: fileId },
        // The measured size wins over the estimate sent before the transfer.
        data: { status: 'READY', size: BigInt(size) },
      }),
    );
  }

  async get(userId: string, fileId: string): Promise<FileResponseDto> {
    return toFileResponse(await this.assertFileAccess(userId, fileId));
  }

  async createDownloadUrl(
    userId: string,
    fileId: string,
  ): Promise<DownloadUrlDto> {
    const file = await this.assertFileAccess(userId, fileId);

    const url = await this.storage.createSignedDownloadUrl(
      file.storageKey,
      DOWNLOAD_TTL_SECONDS,
    );

    return {
      url,
      expiresAt: new Date(
        Date.now() + DOWNLOAD_TTL_SECONDS * 1000,
      ).toISOString(),
    };
  }

  async rename(
    userId: string,
    fileId: string,
    name: string,
  ): Promise<FileResponseDto> {
    const file = await this.assertFileAccess(userId, fileId);

    if (file.name === name) {
      return toFileResponse(file);
    }

    try {
      return toFileResponse(
        await this.prisma.file.update({
          where: { id: fileId },
          data: { name },
        }),
      );
    } catch (error) {
      throw this.translateNameConflict(error, name);
    }
  }

  async move(
    userId: string,
    fileId: string,
    destinationId: string,
  ): Promise<FileResponseDto> {
    const file = await this.assertFileAccess(userId, fileId);
    const destination = await this.access.assertFolderAccess(
      userId,
      destinationId,
    );

    if (destination.dataRoomId !== file.dataRoomId) {
      throw new BadRequestException(
        'A file can only be moved within its own data room.',
      );
    }
    if (destination.id === file.folderId) {
      return toFileResponse(file);
    }

    const name = await this.resolveName(destinationId, file.name);

    try {
      // Storage is untouched: the key holds ids, not the location.
      return toFileResponse(
        await this.prisma.file.update({
          where: { id: fileId },
          data: { folderId: destinationId, name },
        }),
      );
    } catch (error) {
      throw this.translateNameConflict(error, name);
    }
  }

  /**
   * Blob first, row second. An orphaned row can be found and cleaned up; an
   * orphaned blob that nothing references cannot.
   */
  async remove(userId: string, fileId: string): Promise<void> {
    const file = await this.assertFileAccess(userId, fileId);

    await this.storage.remove([file.storageKey]);
    await this.prisma.file.delete({ where: { id: fileId } });
  }

  /** Reads through the same gate as folders, via the file's parent. */
  private async assertFileAccess(
    userId: string,
    fileId: string,
  ): Promise<File> {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });

    if (!file) {
      throw new NotFoundException('File not found');
    }
    await this.access.assertFolderAccess(userId, file.folderId);
    return file;
  }

  private async resolveName(folderId: string, name: string): Promise<string> {
    const siblings = await this.prisma.file.findMany({
      where: { folderId },
      select: { name: true },
    });

    // Split so "Report.pdf" becomes "Report (2).pdf", not "Report.pdf (2)".
    const [stem, extension] = splitExtension(name);
    const taken = new Set(
      siblings
        .filter((s) => splitExtension(s.name)[1] === extension)
        .map((s) => splitExtension(s.name)[0]),
    );

    return `${nextAvailableName(stem, taken)}${extension}`;
  }

  private translateNameConflict(error: unknown, name: string): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === UNIQUE_VIOLATION
    ) {
      return new ConflictException(
        `A file named "${name}" already exists in that folder.`,
      );
    }
    return error;
  }
}
