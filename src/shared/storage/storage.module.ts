import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import {
  STORAGE_PROVIDER,
  StorageProvider,
} from './storage-provider.interface';

@Module({
  providers: [
    LocalStorageProvider,
    S3StorageProvider,
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService, LocalStorageProvider, S3StorageProvider],
      useFactory: (
        configService: ConfigService<AppConfig, true>,
        local: LocalStorageProvider,
        s3: S3StorageProvider,
      ): StorageProvider =>
        configService.get('storage.driver', { infer: true }) === 's3'
          ? s3
          : local,
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
