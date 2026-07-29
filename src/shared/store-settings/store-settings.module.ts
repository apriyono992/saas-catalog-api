import { Module } from '@nestjs/common';
import { StoreSettingsRepository } from './store-settings.repository';
import { StoreSettingsService } from './store-settings.service';

@Module({
  providers: [StoreSettingsRepository, StoreSettingsService],
  exports: [StoreSettingsRepository, StoreSettingsService],
})
export class StoreSettingsModule {}
