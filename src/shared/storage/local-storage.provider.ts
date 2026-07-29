import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { extname, join } from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { AppConfig } from '../../config/configuration';
import {
  StorageProvider,
  UploadedFileInput,
} from './storage-provider.interface';

/** Must match the prefix `main.ts` registers via `app.useStaticAssets()`. */
export const LOCAL_STORAGE_URL_PREFIX = '/uploads';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;

  constructor(configService: ConfigService<AppConfig, true>) {
    this.uploadDir = configService.get('storage.uploadDir', { infer: true });
  }

  async upload(directory: string, file: UploadedFileInput): Promise<string> {
    const targetDir = join(this.uploadDir, directory);
    await mkdir(targetDir, { recursive: true });

    const filename = `${randomUUID()}${extname(file.filename)}`;
    await writeFile(join(targetDir, filename), file.buffer);

    return `${LOCAL_STORAGE_URL_PREFIX}/${directory}/${filename}`;
  }

  async delete(url: string): Promise<void> {
    const prefix = `${LOCAL_STORAGE_URL_PREFIX}/`;
    const relativePath = url.startsWith(prefix)
      ? url.slice(prefix.length)
      : url;

    await rm(join(this.uploadDir, relativePath), { force: true });
  }
}
