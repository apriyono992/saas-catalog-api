import { Module } from '@nestjs/common';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import { StorageService } from './storage.service';
import { STORAGE_PROVIDER } from './storage-provider.interface';

@Module({
  providers: [
    LocalStorageProvider,
    S3StorageProvider,
    StorageService,
    {
      provide: STORAGE_PROVIDER,
      useExisting: StorageService,
    },
  ],
  exports: [STORAGE_PROVIDER, StorageService],
})
export class StorageModule {}
