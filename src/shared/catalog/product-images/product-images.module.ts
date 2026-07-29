import { Module } from '@nestjs/common';
import { StorageModule } from '../../storage/storage.module';
import { ProductsModule } from '../products/products.module';
import { ProductImagesRepository } from './product-images.repository';
import { ProductImagesService } from './product-images.service';

@Module({
  imports: [ProductsModule, StorageModule],
  providers: [ProductImagesRepository, ProductImagesService],
  exports: [ProductImagesService],
})
export class ProductImagesModule {}
