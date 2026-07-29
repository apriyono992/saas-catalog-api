import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { MarketplaceLinksRepository } from './marketplace-links.repository';
import { MarketplaceLinksService } from './marketplace-links.service';

@Module({
  imports: [ProductsModule],
  providers: [MarketplaceLinksRepository, MarketplaceLinksService],
  exports: [MarketplaceLinksRepository, MarketplaceLinksService],
})
export class MarketplaceLinksModule {}
