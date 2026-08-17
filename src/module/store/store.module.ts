import { Module } from '@nestjs/common';
import { TenantsModule } from '../../shared/tenants/tenants.module';
import { StoreSettingsModule } from '../../shared/store-settings/store-settings.module';
import { ProductsModule } from '../../shared/catalog/products/products.module';
import { CategoriesModule } from '../../shared/catalog/categories/categories.module';
import { MarketplaceLinksModule } from '../../shared/catalog/marketplace-links/marketplace-links.module';
import { AnalyticsModule } from '../../shared/analytics/analytics.module';
import { StoreInfoController } from './controllers/store-info.controller';
import { ProductsController } from './controllers/products.controller';
import { CategoriesController } from './controllers/categories.controller';
import { MarketplaceController } from './controllers/marketplace.controller';

@Module({
  imports: [
    TenantsModule,
    StoreSettingsModule,
    ProductsModule,
    CategoriesModule,
    MarketplaceLinksModule,
    AnalyticsModule,
  ],
  controllers: [
    StoreInfoController,
    ProductsController,
    CategoriesController,
    MarketplaceController,
  ],
})
export class StoreModule {}
