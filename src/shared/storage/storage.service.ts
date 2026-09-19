import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { AppConfig } from '../../config/configuration';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import type { Database } from '../../database/database.providers';
import { storeSettings } from '../../database/schema';
import { decryptSecret } from '../../common/utils/encryption.util';
import { LocalStorageProvider, LOCAL_STORAGE_URL_PREFIX } from './local-storage.provider';
import { S3StorageProvider, S3StorageClient, S3StorageOptions } from './s3-storage.provider';
import { StorageProvider, UploadedFileInput } from './storage-provider.interface';

@Injectable()
export class StorageService implements StorageProvider {
  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly localStorageProvider: LocalStorageProvider,
    private readonly defaultS3StorageProvider: S3StorageProvider,
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async getProviderForTenant(tenantId?: string | null): Promise<StorageProvider> {
    if (!tenantId) {
      return this.getDefaultProvider();
    }

    const settings = await this.db.query.storeSettings.findFirst({
      where: eq(storeSettings.tenantId, tenantId),
    });

    const driver =
      settings?.storageDriver ??
      this.configService.get('storage.driver', { infer: true });

    if (driver === 's3') {
      const s3Config = this.resolveS3Config(settings);
      if (s3Config) {
        return new S3StorageClient(s3Config);
      }
      return this.defaultS3StorageProvider;
    }

    return this.localStorageProvider;
  }

  private resolveS3Config(
    settings?: typeof storeSettings.$inferSelect | null,
  ): S3StorageOptions | null {
    const envS3 = this.configService.get('storage.s3', { infer: true });

    const accessKeyId = settings?.s3AccessKeyId || envS3.accessKeyId;
    let secretAccessKey = settings?.s3SecretAccessKey
      ? decryptSecret(settings.s3SecretAccessKey)
      : envS3.secretAccessKey;

    if (!accessKeyId || !secretAccessKey) {
      return null;
    }

    return {
      endpoint: settings?.s3Endpoint || envS3.endpoint,
      region: settings?.s3Region || envS3.region || 'auto',
      bucket: settings?.s3Bucket || envS3.bucket || 'catalog',
      accessKeyId,
      secretAccessKey,
      publicUrlBase: settings?.s3PublicUrlBase || envS3.publicUrlBase,
    };
  }

  private getDefaultProvider(): StorageProvider {
    const driver = this.configService.get('storage.driver', { infer: true });
    return driver === 's3'
      ? this.defaultS3StorageProvider
      : this.localStorageProvider;
  }

  async upload(
    directory: string,
    file: UploadedFileInput,
    tenantId?: string | null,
  ): Promise<string> {
    const provider = await this.getProviderForTenant(tenantId);
    return provider.upload(directory, file, tenantId);
  }

  async delete(url: string, tenantId?: string | null): Promise<void> {
    if (!url) return;
    if (url.startsWith(LOCAL_STORAGE_URL_PREFIX)) {
      await this.localStorageProvider.delete(url).catch(() => undefined);
      return;
    }

    const provider = await this.getProviderForTenant(tenantId);
    await provider.delete(url, tenantId).catch(() => undefined);
  }
}
