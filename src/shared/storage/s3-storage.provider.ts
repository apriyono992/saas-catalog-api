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

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase: string;

  constructor(configService: ConfigService<AppConfig, true>) {
    const s3Config = configService.get('storage.s3', { infer: true });

    this.bucket = s3Config.bucket;
    this.publicUrlBase =
      s3Config.publicUrlBase ??
      `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com`;

    this.client = new S3Client({
      region: s3Config.region,
      endpoint: s3Config.endpoint,
      // Path-style is required by most non-AWS S3-compatible services
      // (MinIO, etc.); virtual-hosted-style (AWS default) needs it off.
      forcePathStyle: !!s3Config.endpoint,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });
  }

  async upload(directory: string, file: UploadedFileInput): Promise<string> {
    const key = `${directory}/${randomUUID()}${extname(file.filename)}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimeType,
        // Requires the bucket to allow ACLs. Buckets created with AWS's
        // "Bucket owner enforced" default (the default since 2023) reject
        // this — use a bucket policy for public read instead in that case.
        ACL: 'public-read',
      }),
    );

    return `${this.publicUrlBase}/${key}`;
  }

  async delete(url: string): Promise<void> {
    const prefix = `${this.publicUrlBase}/`;
    const key = url.startsWith(prefix) ? url.slice(prefix.length) : url;

    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
