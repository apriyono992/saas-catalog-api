import { Module } from '@nestjs/common';
import { AuthModule } from '../../shared/auth/auth.module';
import { DomainsModule } from '../../shared/domains/domains.module';
import { UsersModule } from '../../shared/users/users.module';
import { ProductsModule } from '../../shared/catalog/products/products.module';
import { ProductImagesModule } from '../../shared/catalog/product-images/product-images.module';
import { ProductVariantsModule } from '../../shared/catalog/product-variants/product-variants.module';
import { MarketplaceLinksModule } from '../../shared/catalog/marketplace-links/marketplace-links.module';
import { AuthController } from './auth/auth.controller';
import { DomainsController } from './domains/domains.controller';
import { ProfileController } from './profile/profile.controller';
import { ProductsController } from './products/products.controller';
import { ProductImagesController } from './products/product-images.controller';
import { ProductVariantTypesController } from './products/product-variant-types.controller';
import { ProductVariantOptionsController } from './products/product-variant-options.controller';
import { ProductMarketplaceLinksController } from './products/marketplace-links.controller';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    DomainsModule,
    ProductsModule,
    ProductImagesModule,
    ProductVariantsModule,
    MarketplaceLinksModule,
  ],
  controllers: [
    AuthController,
    ProfileController,
    DomainsController,
    ProductsController,
    ProductImagesController,
    ProductVariantTypesController,
    ProductVariantOptionsController,
    ProductMarketplaceLinksController,
  ],
})
export class AdminModule {}
