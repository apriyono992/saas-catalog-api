import { Module } from '@nestjs/common';
import { MarketplaceLinksRepository } from './marketplace-links.repository';
import { MarketplaceLinksService } from './marketplace-links.service';

@Module({
  providers: [MarketplaceLinksRepository, MarketplaceLinksService],
  exports: [MarketplaceLinksRepository, MarketplaceLinksService],
})
export class MarketplaceLinksModule {}
