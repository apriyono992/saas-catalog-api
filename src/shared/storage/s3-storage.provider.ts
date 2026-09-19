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

/** Shared logic — used both by the NestJS-injected singleton and by per-tenant instances. */
export function createS3Client(opts: S3StorageOptions): {
  client: S3Client;
  bucket: string;
  publicUrlBase: string;
} {
  const bucket = opts.bucket || 'catalog';
  const publicUrlBase =
    opts.publicUrlBase?.replace(/\/$/, '') ??
    (opts.endpoint
      ? `${opts.endpoint.replace(/\/$/, '')}/${bucket}`
      : `https://${bucket}.s3.${opts.region || 'us-east-1'}.amazonaws.com`);

  const client = new S3Client({
    region: opts.region || 'auto',
    endpoint: opts.endpoint,
    forcePathStyle: !!opts.endpoint,
    credentials: {
      accessKeyId: opts.accessKeyId,
      secretAccessKey: opts.secretAccessKey,
    },
  });

  return { client, bucket, publicUrlBase };
}

/** Single-use instance built from explicit options — NOT registered in NestJS DI. */
export class S3StorageClient implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase: string;

  constructor(opts: S3StorageOptions) {
    const { client, bucket, publicUrlBase } = createS3Client(opts);
    this.client = client;
    this.bucket = bucket;
    this.publicUrlBase = publicUrlBase;
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

/** NestJS-injectable singleton — reads credentials from ConfigService. */
@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly inner: S3StorageClient;

  constructor(configService: ConfigService<AppConfig, true>) {
    const cfg = configService.get('storage.s3', { infer: true });
    this.inner = new S3StorageClient({
      bucket: cfg.bucket,
      region: cfg.region || 'auto',
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      endpoint: cfg.endpoint,
      publicUrlBase: cfg.publicUrlBase,
    });
  }

  upload(
    directory: string,
    file: UploadedFileInput,
    tenantId?: string | null,
  ): Promise<string> {
    return this.inner.upload(directory, file, tenantId);
  }

  delete(url: string, tenantId?: string | null): Promise<void> {
    return this.inner.delete(url, tenantId);
  }
}
