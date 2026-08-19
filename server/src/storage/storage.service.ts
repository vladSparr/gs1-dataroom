import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

/**
 * The only file on the server that touches Supabase Storage or holds the
 * service role key. Bytes never pass through this API: the browser uploads
 * straight to a signed URL, so a large PDF cannot occupy the single worker
 * for the length of a transfer.
 */
@Injectable()
export class StorageService {
  private readonly bucket: ReturnType<
    ReturnType<typeof createClient>['storage']['from']
  >;

  constructor(config: ConfigService) {
    const client = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      // Nothing to persist: the key is static and the client is per-process.
      { auth: { persistSession: false } },
    );

    this.bucket = client.storage.from(
      config.getOrThrow<string>('SUPABASE_STORAGE_BUCKET'),
    );
  }

  async createSignedUploadUrl(
    key: string,
  ): Promise<{ signedUrl: string; token: string }> {
    // upsert: a retry of a failed upload reuses the same fileId, so the same key.
    const { data, error } = await this.bucket.createSignedUploadUrl(key, {
      upsert: true,
    });

    if (error || !data) {
      throw new InternalServerErrorException('Could not prepare the upload');
    }
    return { signedUrl: data.signedUrl, token: data.token };
  }

  async createSignedDownloadUrl(
    key: string,
    expiresInSeconds: number,
  ): Promise<string> {
    const { data, error } = await this.bucket.createSignedUrl(
      key,
      expiresInSeconds,
    );

    if (error || !data) {
      throw new InternalServerErrorException('Could not prepare the download');
    }
    return data.signedUrl;
  }

  /** Guards `complete` against a client that never uploaded anything. */
  async exists(key: string): Promise<boolean> {
    const separator = key.lastIndexOf('/');
    const prefix = key.slice(0, separator);
    const name = key.slice(separator + 1);

    const { data, error } = await this.bucket.list(prefix, {
      search: name,
      limit: 1,
    });

    if (error) {
      throw new InternalServerErrorException('Could not read the upload');
    }
    return (data ?? []).some((object) => object.name === name);
  }

  async remove(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    const { error } = await this.bucket.remove(keys);
    if (error) {
      throw new InternalServerErrorException(
        'Could not delete the stored file',
      );
    }
  }
}
