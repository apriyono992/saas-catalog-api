import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from './config/config.module';
import { AppConfig } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { StorageModule } from './shared/storage/storage.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './shared/auth/auth.module';
import { UsersModule } from './shared/users/users.module';
import { TenantsModule } from './shared/tenants/tenants.module';
import { DomainsModule } from './shared/domains/domains.module';
import { TenantModule } from './shared/tenant/tenant.module';
import { TenantMiddleware } from './shared/tenant/tenant.middleware';
import { StoreSettingsModule } from './shared/store-settings/store-settings.module';
import { CategoriesModule } from './shared/catalog/categories/categories.module';
import { ProductsModule } from './shared/catalog/products/products.module';
import { ProductImagesModule } from './shared/catalog/product-images/product-images.module';
import { ProductVariantsModule } from './shared/catalog/product-variants/product-variants.module';
import { MarketplaceLinksModule } from './shared/catalog/marketplace-links/marketplace-links.module';
import { AnalyticsModule } from './shared/analytics/analytics.module';
import { ActivityLogModule } from './shared/activity-log/activity-log.module';
import { AdminModule } from './module/admin/admin.module';
import { StoreModule } from './module/store/store.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        pinoHttp: {
          level:
            configService.get('app.nodeEnv', { infer: true }) === 'production'
              ? 'info'
              : 'debug',
        },
      }),
    }),
    DatabaseModule,
    CommonModule,
    StorageModule,
    HealthModule,
    UsersModule,
    AuthModule,
    TenantsModule,
    DomainsModule,
    TenantModule,
    StoreSettingsModule,
    CategoriesModule,
    ProductsModule,
    ProductImagesModule,
    ProductVariantsModule,
    MarketplaceLinksModule,
    AnalyticsModule,
    ActivityLogModule,
    AdminModule,
    StoreModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('store', 'store/*path');
  }
}
