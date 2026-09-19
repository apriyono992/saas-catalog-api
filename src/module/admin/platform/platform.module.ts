import { Module } from '@nestjs/common';
import { DomainsModule } from '../../../shared/domains/domains.module';
import { StoreSettingsModule } from '../../../shared/store-settings/store-settings.module';
import { TenantsModule } from '../../../shared/tenants/tenants.module';
import { UsersModule } from '../../../shared/users/users.module';
import { MarketplacesModule } from '../../../shared/catalog/marketplaces/marketplaces.module';
import { PlatformTenantsController } from './tenants/tenants.controller';
import { PlatformUsersController } from './users/users.controller';
import { PlatformMarketplacesController } from './marketplaces/platform-marketplaces.controller';

@Module({
  imports: [
    DomainsModule,
    StoreSettingsModule,
    TenantsModule,
    UsersModule,
    MarketplacesModule,
  ],
  controllers: [
    PlatformTenantsController,
    PlatformUsersController,
    PlatformMarketplacesController,
  ],
})
export class PlatformModule {}
