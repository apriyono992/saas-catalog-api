import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { AppConfig } from '../../config/configuration';
import {
  StorageProvider,
  UploadedFileInput,
} from './storage-provider.interface';

export interface S3StorageOptions {
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrlBase?: string;
}

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase: string;

  constructor(config: S3StorageOptions | ConfigService<AppConfig, true>) {
    let s3Config: S3StorageOptions;
    if (config instanceof ConfigService) {
      const cfg = config.get('storage.s3', { infer: true });
      s3Config = {
        bucket: cfg.bucket,
        region: cfg.region || 'auto',
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
        endpoint: cfg.endpoint,
        publicUrlBase: cfg.publicUrlBase,
      };
    } else {
      s3Config = config;
    }

    this.bucket = s3Config.bucket || 'catalog';
    this.publicUrlBase =
      s3Config.publicUrlBase?.replace(/\/$/, '') ??
      (s3Config.endpoint
        ? `${s3Config.endpoint.replace(/\/$/, '')}/${this.bucket}`
        : `https://${this.bucket}.s3.${s3Config.region || 'us-east-1'}.amazonaws.com`);

    this.client = new S3Client({
      region: s3Config.region || 'auto',
      endpoint: s3Config.endpoint,
      // Path-style is required by Cloudflare R2 and non-AWS S3 services
      forcePathStyle: !!s3Config.endpoint,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });
  }

  async upload(
    directory: string,
    file: UploadedFileInput,
    _tenantId?: string | null,
  ): Promise<string> {
    const key = `${directory}/${randomUUID()}${extname(file.filename)}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimeType,
        // No ACL specified: Cloudflare R2 rejects 'public-read' header
      }),
    );

    return `${this.publicUrlBase}/${key}`;
  }

  async delete(url: string, _tenantId?: string | null): Promise<void> {
    const prefix = `${this.publicUrlBase}/`;
    const key = url.startsWith(prefix) ? url.slice(prefix.length) : url;

    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
