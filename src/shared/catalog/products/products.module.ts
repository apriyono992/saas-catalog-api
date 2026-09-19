import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { StoreSettingsModule } from '../../store-settings/store-settings.module';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

@Module({
  imports: [CategoriesModule, StoreSettingsModule],
  providers: [ProductsRepository, ProductsService],
  exports: [ProductsRepository, ProductsService],
})
export class ProductsModule {}
