import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { STORAGE_PROVIDER } from '../../storage/storage-provider.interface';
import type {
  StorageProvider,
  UploadedFileInput,
} from '../../storage/storage-provider.interface';
import { ProductsService } from '../products/products.service';
import { ProductImagesRepository } from './product-images.repository';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class ProductImagesService {
  constructor(
    private readonly productImagesRepository: ProductImagesRepository,
    private readonly productsService: ProductsService,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
  ) {}

  async upload(
    tenantId: string | null,
    productId: string,
    file: UploadedFileInput,
  ) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
      throw new BadRequestException(
        'Only JPEG, PNG, or WEBP images are allowed',
      );
    }

    await this.productsService.findByIdForTenantOrThrow(tenantId, productId);

    const url = await this.storageProvider.upload(
      `products/${productId}`,
      file,
    );
    const sortOrder =
      await this.productImagesRepository.nextSortOrder(productId);
    return this.productImagesRepository.create(productId, url, sortOrder);
  }

  async remove(tenantId: string | null, productId: string, imageId: string) {
    await this.productsService.findByIdForTenantOrThrow(tenantId, productId);

    const image = await this.productImagesRepository.findByIdForProduct(
      imageId,
      productId,
    );
    if (!image) {
      throw new NotFoundException('Image not found');
    }

    await this.productImagesRepository.delete(imageId);
    await this.storageProvider.delete(image.url);
  }

  async reorder(
    tenantId: string | null,
    productId: string,
    orderedIds: string[],
  ) {
    await this.productsService.findByIdForTenantOrThrow(tenantId, productId);
    await this.productImagesRepository.reorder(productId, orderedIds);
  }
}
