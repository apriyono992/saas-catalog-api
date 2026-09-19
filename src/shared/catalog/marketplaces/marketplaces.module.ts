import { Module } from '@nestjs/common';
import { StorageModule } from '../../storage/storage.module';
import { MarketplacesRepository } from './marketplaces.repository';
import { MarketplacesService } from './marketplaces.service';

@Module({
  imports: [StorageModule],
  providers: [MarketplacesRepository, MarketplacesService],
  exports: [MarketplacesRepository, MarketplacesService],
})
export class MarketplacesModule {}
