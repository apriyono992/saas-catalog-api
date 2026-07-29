import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { ProductVariantTypesRepository } from './product-variant-types.repository';
import { ProductVariantTypesService } from './product-variant-types.service';
import { ProductVariantOptionsRepository } from './product-variant-options.repository';
import { ProductVariantOptionsService } from './product-variant-options.service';

@Module({
  imports: [ProductsModule],
  providers: [
    ProductVariantTypesRepository,
    ProductVariantTypesService,
    ProductVariantOptionsRepository,
    ProductVariantOptionsService,
  ],
  exports: [ProductVariantTypesService, ProductVariantOptionsService],
})
export class ProductVariantsModule {}
