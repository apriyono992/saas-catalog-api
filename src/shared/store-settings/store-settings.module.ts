import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { StoreSettingsRepository } from './store-settings.repository';
import { StoreSettingsService } from './store-settings.service';

@Module({
  imports: [StorageModule],
  providers: [StoreSettingsRepository, StoreSettingsService],
  exports: [StoreSettingsRepository, StoreSettingsService],
})
export class StoreSettingsModule {}
