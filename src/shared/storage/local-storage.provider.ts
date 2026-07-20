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
    const targetPath = join(targetDir, filename);
    await writeFile(targetPath, file.buffer);

    return join(directory, filename);
  }

  async delete(url: string): Promise<void> {
    const targetPath = join(this.uploadDir, url);
    await rm(targetPath, { force: true });
  }
}
