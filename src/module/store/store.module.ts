import { Module } from '@nestjs/common';
import { TenantsModule } from '../../shared/tenants/tenants.module';
import { StoreSettingsModule } from '../../shared/store-settings/store-settings.module';
import { ProductsModule } from '../../shared/catalog/products/products.module';
import { MarketplaceLinksModule } from '../../shared/catalog/marketplace-links/marketplace-links.module';
import { AnalyticsModule } from '../../shared/analytics/analytics.module';
import { StoreInfoController } from './controllers/store-info.controller';
import { ProductsController } from './controllers/products.controller';
import { MarketplaceController } from './controllers/marketplace.controller';

@Module({
  imports: [
    TenantsModule,
    StoreSettingsModule,
    ProductsModule,
    MarketplaceLinksModule,
    AnalyticsModule,
  ],
  controllers: [StoreInfoController, ProductsController, MarketplaceController],
})
export class StoreModule {}
